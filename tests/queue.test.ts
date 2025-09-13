import { QueueManager } from '../src/core/queue/QueueManager';

test('queue manages jobs sequentially', async () => {
  const queue = new QueueManager();
  
  // Mock engine factory with delay
  queue.setEngineFactory(() => ({
    generate: async (req) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        image: new ArrayBuffer(100),
        meta: { seed: req.seed }
      };
    }
  }));

  // Add jobs
  const id1 = queue.add({engine:'nanobanana', prompt:'test1', strength:0.7, refWeight:0});
  const id2 = queue.add({engine:'flux', prompt:'test2', strength:0.8, refWeight:0});
  
  expect(queue.list()).toHaveLength(2);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const jobs = queue.list();
  expect(jobs.some(j => j.status === 'done')).toBe(true);
  
  queue.clearFinished();
  expect(queue.list().every(j => j.status !== 'done' && j.status !== 'failed')).toBe(true);
});