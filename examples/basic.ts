import { Queen } from '../src/index.js';

async function main() {
  console.log('🐝 Nexus — Basic Example\n');

  const queen = new Queen();

  // Add 3 workers with different capabilities
  const w1 = queen.addWorker('worker-1', ['analysis', 'writing']);
  const w2 = queen.addWorker('worker-2', ['coding', 'testing']);
  const w3 = queen.addWorker('worker-3', ['translation', 'writing']);

  // Register custom executors
  w1.setExecutor(async (task) => {
    console.log(`  🔵 worker-1 executing: ${task.description}`);
    await sleep(100);
    return `[worker-1] analyzed: ${task.description}`;
  });

  w2.setExecutor(async (task) => {
    console.log(`  🟢 worker-2 executing: ${task.description}`);
    await sleep(80);
    return `[worker-2] coded: ${task.description}`;
  });

  w3.setExecutor(async (task) => {
    console.log(`  🟡 worker-3 executing: ${task.description}`);
    await sleep(120);
    return `[worker-3] translated: ${task.description}`;
  });

  // Execute a complex task
  console.log('📥 Task: Analyze market trends; draft a summary; translate to Chinese\n');
  const result = await queen.execute(
    'Analyze market trends. Draft a summary report. Translate key findings to Chinese.'
  );

  console.log('\n✅ Results:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n📊 Swarm status:');
  console.log(JSON.stringify(queen.status(), null, 2));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
