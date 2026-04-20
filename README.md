# Nexus

**A Swarm-Intelligence Framework for Distributed Multi-Agent Collaboration**

[![CI](https://github.com/LiuYi180/Nexus/actions/workflows/ci.yml/badge.svg)](https://github.com/LiuYi180/Nexus/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/nexus-swarm)](https://www.npmjs.com/package/nexus-swarm)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Nexus coordinates multiple LLM agents across physical machines using swarm intelligence. Instead of a single orchestrator bottleneck, agents self-organize through a lightweight pheromone protocol — picking up tasks, competing for work, and healing failures autonomously.

## Quick Start

```bash
npm install nexus-swarm
```

```typescript
import { Queen } from 'nexus-swarm';

// Create a Queen with 3 Worker agents
const queen = new Queen();
queen.addWorker('worker-1');
queen.addWorker('worker-2');
queen.addWorker('worker-3');

// Execute a complex task — automatically decomposed and distributed
const result = await queen.execute(
  'Analyze these 3 articles and generate a comparison report'
);
console.log(result);
```

## How It Works

```
┌─────────────┐     ┌──────────────────────────────────────┐     ┌─────────────┐
│   User      │────▶│  Queen Agent                         │     │  Worker A   │
│   Request   │     │  ┌────────────┐ ┌─────────────────┐  │     │  ┌────────┐ │
└─────────────┘     │  │ Task       │ │ Pheromone       │  │◀───▶│  │ Execute│ │
                    │  │ Decomposer │ │ Manager         │  │     │  └────────┘ │
                    │  └────────────┘ └─────────────────┘  │     └─────────────┘
                    │         │              │              │     ┌─────────────┐
                    │         ▼              ▼              │     │  Worker B   │
                    │  ┌────────────┐ ┌─────────────────┐  │     │  ┌────────┐ │
                    │  │ WAOAG      │ │ Pheromone Field │  │◀───▶│  │ Execute│ │
                    │  │ (Task DAG) │ │ (Redis)         │  │     │  └────────┘ │
                    │  └────────────┘ └─────────────────┘  │     └─────────────┘
                    └──────────────────────────────────────┘
```

1. **Decompose** — Queen breaks complex tasks into a Weighted AND/OR Graph (WAOAG)
2. **Publish** — Tasks are broadcast as pheromones (τ_task) into a shared field
3. **Compete** — Workers sense pheromones and claim tasks based on capability and load
4. **Execute** — Workers run tasks in parallel, releasing completion pheromones (τ_done)
5. **Assemble** — Queen collects results and delivers the final output
6. **Self-heal** — If a Worker fails, others automatically pick up its tasks

## Features

- **Distributed** — Agents run across multiple physical machines, not just one process
- **Self-organizing** — No central scheduler; task assignment emerges from local decisions
- **Parallel** — Independent tasks execute simultaneously across Workers
- **Fault-tolerant** — Worker failures trigger automatic task reassignment
- **Heterogeneous** — Mix Windows, Linux, and macOS machines in one swarm

## Architecture

Nexus uses a three-layer architecture:

| Layer | Role | Components |
|-------|------|------------|
| **Perception** | Parse intent, discover resources | Intent Parser, Resource Discovery |
| **Decision** | Decompose tasks, optimize scheduling | WAOAG Builder, Pheromone Manager, Queen |
| **Execution** | Run tasks, report results | Worker Agents, Hive Nodes |

### Agent Roles

| Role | Analogy | Responsibility |
|------|---------|----------------|
| **Queen** | Queen bee | Task decomposition, scheduling, result assembly |
| **Worker** | Worker bee | Execute subtasks, release pheromones |
| **Scout** | Scout bee | Device discovery, resource probing |
| **Doctor** | Nurse bee | Health monitoring, fault diagnosis |

### Pheromone Protocol (PCP)

Agents communicate through a shared pheromone field (backed by Redis or in-memory):

| Pheromone | Format | Purpose |
|-----------|--------|---------|
| `τ_task` | `{taskId, weight, requirements}` | Queen publishes available tasks |
| `τ_ack` | `{agentId, taskId, timestamp}` | Worker claims a task |
| `τ_done` | `{taskId, result, metrics}` | Worker reports completion |
| `τ_heartbeat` | `{agentId, status, load}` | Liveness signal (30s TTL) |
| `τ_alert` | `{agentId, errorType, context}` | Error notification (5min TTL) |

## Distributed Deployment

```typescript
import { Queen, HiveNode } from 'nexus-swarm';

const queen = new Queen();

// Register remote machines
queen.registerNode(new HiveNode({
  id: 'desktop-1',
  endpoint: 'ws://192.168.1.10:8080',
  capabilities: ['code-generation', 'analysis'],
}));

queen.registerNode(new HiveNode({
  id: 'laptop-1',
  endpoint: 'ws://192.168.1.20:8080',
  capabilities: ['writing', 'translation'],
}));

// Deploy workers across nodes
await queen.deploy();

// Execute — tasks automatically route to the best node
const result = await queen.execute('Write and translate a product spec');
```

## Documentation

- [**Paper**](docs/paper.md) — Full academic paper with formal definitions and proofs
- [**Architecture**](docs/architecture.md) — Detailed system design
- [**API Reference**](docs/api/) — Complete API documentation
- [**Examples**](examples/) — Runnable demos and use cases

## Comparison

| Feature | AutoGen | MetaGPT | CAMEL | OpenAI Swarm | **Nexus** |
|---------|---------|---------|-------|--------------|-----------|
| Multi-agent collaboration | ✅ | ✅ | ✅ | ✅ | ✅ |
| Distributed deployment | ❌ | ❌ | ❌ | ❌ | ✅ |
| Parallel execution | ⚠️ | ⚠️ | ❌ | ❌ | ✅ |
| Dynamic task scheduling | ⚠️ | ❌ | ❌ | ⚠️ | ✅ |
| Fault tolerance | ❌ | ❌ | ❌ | ❌ | ✅ |
| Device management | ❌ | ❌ | ❌ | ❌ | ✅ |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). We welcome issues, PRs, and discussions.

## License

[MIT](LICENSE)
