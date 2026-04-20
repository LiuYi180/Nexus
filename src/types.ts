export type TaskType = 'AND' | 'OR' | 'ATOMIC';
export type NodeStatus = 'ONLINE' | 'BUSY' | 'DEGRADED' | 'OFFLINE';
export type AgentRole = 'queen' | 'worker' | 'scout' | 'doctor';
export type PheromoneType = 'task' | 'ack' | 'done' | 'heartbeat' | 'alert';

export interface Task {
  id: string;
  type: TaskType;
  description: string;
  weight: number;
  dependencies: string[];
  capabilities: string[];
  status: 'pending' | 'claimed' | 'running' | 'done' | 'failed';
  assignedTo?: string;
  result?: unknown;
  createdAt: number;
}

export interface Pheromone {
  type: PheromoneType;
  agentId: string;
  taskId?: string;
  data: Record<string, unknown>;
  timestamp: number;
  ttl: number;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output: unknown;
  metrics: {
    durationMs: number;
    tokensUsed?: number;
  };
}

export interface WorkerConfig {
  id: string;
  capabilities: string[];
  maxConcurrent: number;
}

export interface HiveNodeConfig {
  id: string;
  endpoint: string;
  capabilities: string[];
}

export interface QueenConfig {
  pheromoneEvaporationRate: number;
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  maxRetries: number;
}
