export { Queen } from './core/queen.js';
export { Worker } from './core/worker.js';
export { HiveNode } from './core/hive-node.js';
export { PheromoneField, InMemoryPheromoneField } from './pheromone/field.js';
export { TaskDecomposer } from './scheduler/decomposer.js';
export type {
  Task,
  TaskType,
  Pheromone,
  PheromoneType,
  WorkerConfig,
  HiveNodeConfig,
  QueenConfig,
  TaskResult,
  NodeStatus,
  AgentRole,
} from './types.js';
