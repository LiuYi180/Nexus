import type { Pheromone, PheromoneType } from '../types.js';

export interface PheromoneField {
  /** Deposit a pheromone into the field */
  deposit(pheromone: Pheromone): Promise<void>;

  /** Sense pheromones of a specific type */
  sense(type: PheromoneType, filter?: Record<string, unknown>): Promise<Pheromone[]>;

  /** Evaporate expired pheromones */
  evaporate(): Promise<number>;

  /** Clear all pheromones */
  clear(): Promise<void>;
}

/**
 * In-memory pheromone field.
 * For production, use Redis-backed implementation.
 */
export class InMemoryPheromoneField implements PheromoneField {
  private pheromones: Pheromone[] = [];

  async deposit(pheromone: Pheromone): Promise<void> {
    this.pheromones.push(pheromone);
  }

  async sense(type: PheromoneType, filter?: Record<string, unknown>): Promise<Pheromone[]> {
    const now = Date.now();
    return this.pheromones.filter(p => {
      if (p.type !== type) return false;
      if (p.ttl > 0 && now - p.timestamp > p.ttl) return false;
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          if ((p.data as Record<string, unknown>)[key] !== value) return false;
        }
      }
      return true;
    });
  }

  async evaporate(): Promise<number> {
    const now = Date.now();
    const before = this.pheromones.length;
    this.pheromones = this.pheromones.filter(p => {
      if (p.ttl <= 0) return true; // permanent pheromone
      return now - p.timestamp <= p.ttl;
    });
    return before - this.pheromones.length;
  }

  async clear(): Promise<void> {
    this.pheromones = [];
  }
}
