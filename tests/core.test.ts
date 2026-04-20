import { describe, it, expect } from 'vitest';
import { Queen } from '../src/core/queen.js';
import { Worker } from '../src/core/worker.js';
import { InMemoryPheromoneField } from '../src/pheromone/field.js';
import { TaskDecomposer } from '../src/scheduler/decomposer.js';

describe('TaskDecomposer', () => {
  it('should create a single atomic task for simple input', () => {
    const decomposer = new TaskDecomposer();
    const tasks = decomposer.decompose('Write a hello world program');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].type).toBe('ATOMIC');
  });

  it('should decompose multi-part tasks', () => {
    const decomposer = new TaskDecomposer();
    const tasks = decomposer.decompose(
      'Analyze the data. Write a report. Create charts.'
    );
    expect(tasks.length).toBeGreaterThan(1);
    const root = tasks.find(t => t.type === 'AND');
    expect(root).toBeDefined();
  });
});

describe('InMemoryPheromoneField', () => {
  it('should deposit and sense pheromones', async () => {
    const field = new InMemoryPheromoneField();
    await field.deposit({
      type: 'task',
      agentId: 'queen',
      data: { task: { id: 't1', description: 'test' } },
      timestamp: Date.now(),
      ttl: 0,
    });

    const tasks = await field.sense('task');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].agentId).toBe('queen');
  });

  it('should filter by data fields', async () => {
    const field = new InMemoryPheromoneField();
    await field.deposit({
      type: 'ack',
      agentId: 'w1',
      data: { agentId: 'w1', taskId: 't1' },
      timestamp: Date.now(),
      ttl: 0,
    });
    await field.deposit({
      type: 'ack',
      agentId: 'w2',
      data: { agentId: 'w2', taskId: 't2' },
      timestamp: Date.now(),
      ttl: 0,
    });

    const filtered = await field.sense('ack', { taskId: 't1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].agentId).toBe('w1');
  });

  it('should evaporate expired pheromones', async () => {
    const field = new InMemoryPheromoneField();
    await field.deposit({
      type: 'heartbeat',
      agentId: 'w1',
      data: {},
      timestamp: Date.now() - 60_000, // 60s ago
      ttl: 30_000, // 30s TTL
    });

    const evicted = await field.evaporate();
    expect(evicted).toBe(1);

    const remaining = await field.sense('heartbeat');
    expect(remaining).toHaveLength(0);
  });
});

describe('Worker', () => {
  it('should execute tasks and emit done pheromone', async () => {
    const field = new InMemoryPheromoneField();
    const worker = new Worker(
      { id: 'w1', capabilities: ['test'], maxConcurrent: 2 },
      field,
    );

    // Publish a task
    await field.deposit({
      type: 'task',
      agentId: 'queen',
      taskId: 't1',
      data: {
        task: {
          id: 't1',
          type: 'ATOMIC',
          description: 'test task',
          weight: 1,
          dependencies: [],
          capabilities: [],
          status: 'pending',
          createdAt: Date.now(),
        },
      },
      timestamp: Date.now(),
      ttl: 0,
    });

    await worker.start();

    const done = await field.sense('done');
    expect(done).toHaveLength(1);
    expect(done[0].taskId).toBe('t1');
  });
});

describe('Queen', () => {
  it('should execute a task and return results', async () => {
    const queen = new Queen();
    const w = queen.addWorker('w1', ['test']);
    w.setExecutor(async (task) => `result: ${task.description}`);

    const result = await queen.execute('do something');
    expect(result.success).toBe(true);
    expect(result.output).toBeDefined();
  });

  it('should report swarm status', () => {
    const queen = new Queen();
    queen.addWorker('w1');
    queen.addWorker('w2');

    const status = queen.status();
    expect(status.workers).toBe(2);
    expect(status.workerDetails).toHaveLength(2);
  });
});
