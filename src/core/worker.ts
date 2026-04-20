import type { Task, WorkerConfig, TaskResult, Pheromone } from '../types.js';
import type { PheromoneField } from '../pheromone/field.js';

/**
 * Worker Agent — executes tasks and communicates via pheromones.
 */
export class Worker {
  readonly id: string;
  readonly capabilities: Set<string>;
  readonly maxConcurrent: number;

  private field: PheromoneField;
  private activeTasks: Map<string, Task> = new Map();
  private executor?: (task: Task) => Promise<unknown>;

  constructor(config: WorkerConfig, field: PheromoneField) {
    this.id = config.id;
    this.capabilities = new Set(config.capabilities);
    this.maxConcurrent = config.maxConcurrent;
    this.field = field;
  }

  /** Register a task executor function */
  setExecutor(fn: (task: Task) => Promise<unknown>): void {
    this.executor = fn;
  }

  /** Start the worker loop: sense tasks, claim, execute */
  async start(): Promise<void> {
    await this.emitHeartbeat();

    const taskPheromones = await this.field.sense('task');

    for (const pheromone of taskPheromones) {
      if (this.activeTasks.size >= this.maxConcurrent) break;

      const task = pheromone.data.task as Task;
      if (!task || task.status !== 'pending') continue;

      // Check capability match
      if (task.capabilities.length > 0) {
        const hasCap = task.capabilities.some(c => this.capabilities.has(c));
        if (!hasCap) continue;
      }

      // Claim the task
      await this.claimTask(task);

      // Execute
      await this.executeTask(task);
    }
  }

  private async claimTask(task: Task): Promise<void> {
    task.status = 'claimed';
    task.assignedTo = this.id;
    this.activeTasks.set(task.id, task);

    await this.field.deposit({
      type: 'ack',
      agentId: this.id,
      taskId: task.id,
      data: { agentId: this.id, taskId: task.id },
      timestamp: Date.now(),
      ttl: 0, // permanent
    });
  }

  private async executeTask(task: Task): Promise<void> {
    task.status = 'running';
    const startTime = Date.now();

    try {
      const output = this.executor
        ? await this.executor(task)
        : `Completed: ${task.description}`;

      const result: TaskResult = {
        taskId: task.id,
        success: true,
        output,
        metrics: { durationMs: Date.now() - startTime },
      };

      task.status = 'done';
      task.result = output;

      await this.field.deposit({
        type: 'done',
        agentId: this.id,
        taskId: task.id,
        data: { result },
        timestamp: Date.now(),
        ttl: 0,
      });
    } catch (err) {
      task.status = 'failed';

      await this.field.deposit({
        type: 'alert',
        agentId: this.id,
        taskId: task.id,
        data: {
          errorType: 'execution-failed',
          context: String(err),
        },
        timestamp: Date.now(),
        ttl: 300_000, // 5 min
      });
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  private async emitHeartbeat(): Promise<void> {
    await this.field.deposit({
      type: 'heartbeat',
      agentId: this.id,
      data: {
        agentId: this.id,
        status: this.activeTasks.size > 0 ? 'busy' : 'idle',
        load: this.activeTasks.size / this.maxConcurrent,
      },
      timestamp: Date.now(),
      ttl: 30_000, // 30s
    });
  }

  /** Get current load ratio (0-1) */
  get load(): number {
    return this.activeTasks.size / this.maxConcurrent;
  }
}
