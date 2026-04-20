import type { Task, QueenConfig, TaskResult } from '../types.js';
import { Worker } from './worker.js';
import { HiveNode } from './hive-node.js';
import { InMemoryPheromoneField, type PheromoneField } from '../pheromone/field.js';
import { TaskDecomposer } from '../scheduler/decomposer.js';

const DEFAULT_CONFIG: QueenConfig = {
  pheromoneEvaporationRate: 0.1,
  heartbeatIntervalMs: 30_000,
  heartbeatTimeoutMs: 90_000,
  maxRetries: 3,
};

/**
 * Queen Agent — orchestrates task decomposition, scheduling, and result assembly.
 */
export class Queen {
  private config: QueenConfig;
  private field: PheromoneField;
  private decomposer: TaskDecomposer;
  private workers: Map<string, Worker> = new Map();
  private nodes: Map<string, HiveNode> = new Map();

  constructor(config?: Partial<QueenConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.field = new InMemoryPheromoneField();
    this.decomposer = new TaskDecomposer();
  }

  /** Add a Worker to the swarm */
  addWorker(id: string, capabilities: string[] = [], maxConcurrent = 3): Worker {
    const worker = new Worker(
      { id, capabilities, maxConcurrent },
      this.field,
    );
    this.workers.set(id, worker);
    return worker;
  }

  /** Register a remote HiveNode */
  registerNode(node: HiveNode): void {
    node.status = 'ONLINE';
    this.nodes.set(node.id, node);
  }

  /** Remove a Worker */
  removeWorker(id: string): void {
    this.workers.delete(id);
  }

  /** Get the pheromone field (for custom implementations) */
  getField(): PheromoneField {
    return this.field;
  }

  /** Set a custom pheromone field (e.g., Redis-backed) */
  setField(field: PheromoneField): void {
    this.field = field;
  }

  /**
   * Execute a complex task:
   * 1. Decompose into subtasks
   * 2. Publish as pheromones
   * 3. Let Workers compete and execute
   * 4. Collect and assemble results
   */
  async execute(description: string): Promise<TaskResult> {
    const startTime = Date.now();

    // Step 1: Decompose
    const tasks = this.decomposer.decompose(description);
    const atomicTasks = tasks.filter(t => t.type === 'ATOMIC');

    if (atomicTasks.length === 0) {
      return {
        taskId: 'root',
        success: true,
        output: description,
        metrics: { durationMs: Date.now() - startTime },
      };
    }

    // Step 2: Publish task pheromones
    for (const task of atomicTasks) {
      await this.field.deposit({
        type: 'task',
        agentId: 'queen',
        taskId: task.id,
        data: { task },
        timestamp: Date.now(),
        ttl: 0,
      });
    }

    // Step 3: Run workers to pick up tasks
    const workerList = [...this.workers.values()];
    if (workerList.length === 0) {
      throw new Error('No workers available. Call addWorker() first.');
    }

    // Fan-out: each worker runs its loop
    await Promise.all(workerList.map(w => w.start()));

    // Step 4: Collect results from done pheromones
    const donePheromones = await this.field.sense('done');
    const results: TaskResult[] = donePheromones
      .filter(p => atomicTasks.some(t => t.id === p.taskId))
      .map(p => p.data.result as TaskResult);

    const outputs = results.map(r => r.output);

    return {
      taskId: 'root',
      success: results.every(r => r.success),
      output: outputs,
      metrics: {
        durationMs: Date.now() - startTime,
      },
    };
  }

  /** Get swarm status */
  status(): {
    workers: number;
    nodes: number;
    workerDetails: { id: string; load: number }[];
  } {
    return {
      workers: this.workers.size,
      nodes: this.nodes.size,
      workerDetails: [...this.workers.values()].map(w => ({
        id: w.id,
        load: w.load,
      })),
    };
  }
}
