import type { Task, TaskType } from '../types.js';

let taskCounter = 0;

function generateId(): string {
  return `task-${Date.now()}-${++taskCounter}`;
}

/**
 * Decompose a complex task into a Weighted AND/OR Acyclic Graph (WAOAG).
 *
 * In v0.1, this uses a simple heuristic:
 * - Split by natural boundaries (paragraphs, bullet points)
 * - Each subtask is ATOMIC by default
 * - Parent-child dependency creates AND edges
 *
 * Future: integrate LLM for intelligent decomposition.
 */
export class TaskDecomposer {
  /**
   * Decompose a task description into a task graph.
   * Returns a flat list with dependency edges.
   */
  decompose(description: string, options?: { minSubtasks?: number; maxSubtasks?: number }): Task[] {
    const maxSubtasks = options?.maxSubtasks ?? 5;

    // Simple heuristic: split by newlines, semicolons, or "and"
    const parts = description
      .split(/[;\n]|(?<=\.)\s+|(?:\band\b)/i)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    if (parts.length <= 1) {
      // Single atomic task
      return [{
        id: generateId(),
        type: 'ATOMIC',
        description,
        weight: 1,
        dependencies: [],
        capabilities: [],
        status: 'pending',
        createdAt: Date.now(),
      }];
    }

    const tasks: Task[] = [];
    const rootId = generateId();

    // Root AND task
    tasks.push({
      id: rootId,
      type: 'AND',
      description,
      weight: parts.length,
      dependencies: [],
      capabilities: [],
      status: 'pending',
      createdAt: Date.now(),
    });

    // Child atomic tasks
    const limited = parts.slice(0, maxSubtasks);
    for (const part of limited) {
      const childId = generateId();
      tasks.push({
        id: childId,
        type: 'ATOMIC',
        description: part,
        weight: 1,
        dependencies: [rootId],
        capabilities: [],
        status: 'pending',
        createdAt: Date.now(),
      });
    }

    return tasks;
  }
}
