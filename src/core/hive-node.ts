import type { HiveNodeConfig, NodeStatus } from '../types.js';

/**
 * HiveNode — represents a physical or virtual machine in the swarm.
 */
export class HiveNode {
  readonly id: string;
  readonly endpoint: string;
  readonly capabilities: Set<string>;

  private _status: NodeStatus = 'OFFLINE';
  private _workers: string[] = [];

  constructor(config: HiveNodeConfig) {
    this.id = config.id;
    this.endpoint = config.endpoint;
    this.capabilities = new Set(config.capabilities);
  }

  get status(): NodeStatus {
    return this._status;
  }

  set status(value: NodeStatus) {
    this._status = value;
  }

  get workers(): readonly string[] {
    return this._workers;
  }

  addWorker(workerId: string): void {
    this._workers.push(workerId);
  }

  removeWorker(workerId: string): void {
    this._workers = this._workers.filter(id => id !== workerId);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      endpoint: this.endpoint,
      capabilities: [...this.capabilities],
      status: this._status,
      workers: this._workers,
    };
  }
}
