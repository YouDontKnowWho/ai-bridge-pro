import { QueueManager } from '../src/core/queue/QueueManager';
import { GenerationRequest, GenerationResult } from '../src/core/types';
const delay = (ms:number)=> new Promise(r=>setTimeout(r, ms));

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


test('queue runs sequentially and records results', async () => {
  const q = new QueueManager();
  let calls:number[] = [];
  q.setEngineFactory((name:string)=> ({
    async generate(req:GenerationRequest): Promise<GenerationResult>{
      calls.push(Date.now()); await delay(10);
      return { image: new ArrayBuffer(8), meta: { prompt: req.prompt } };
    }
  }));
  q.add({engine:'nanobanana', prompt:'a', negative:'', seed:null, strength:0.7, refImage:null, refWeight:0, region:null});
  q.add({engine:'nanobanana', prompt:'b', negative:'', seed:null, strength:0.7, refImage:null, refWeight:0, region:null});
  await delay(100);
  const jobs = q.list();
  expect(jobs.filter(j=>j.status==='done').length).toBe(2);
  expect(calls.length).toBe(2);
  expect(calls[0]).toBeLessThanOrEqual(calls[1]);
});


test('retryable errors are retried then succeed', async () => {
  const q = new QueueManager();
  q.setRetryOptions({ maxRetries: 2, backoffMs: 1 });
  let attempt = 0;
  q.setEngineFactory(()=> ({
    async generate(): Promise<GenerationResult>{
      attempt++;
      if (attempt < 2) throw new Error('429 rate limit');
      return { image: new ArrayBuffer(1), meta: {} };
    }
  }));
  q.add({engine:'nanobanana', prompt:'retry', negative:'', seed:null, strength:0.7, refImage:null, refWeight:0, region:null});
  await delay(50);
  const job = q.list()[0];
  expect(job.status).toBe('done');
  expect(job.attempts).toBe(1);
});


test('non-retryable error fails without retries', async () => {
  const q = new QueueManager();
  q.setRetryOptions({ maxRetries: 3, backoffMs: 1 });
  let attempt = 0;
  q.setEngineFactory(()=> ({
    async generate(): Promise<GenerationResult>{
      attempt++;
      throw new Error('bad prompt');
    }
  }));
  q.add({engine:'nanobanana', prompt:'fail', negative:'', seed:null, strength:0.7, refImage:null, refWeight:0, region:null});
  await delay(30);
  const job = q.list()[0];
  expect(job.status).toBe('failed');
  expect(job.attempts).toBe(1);
});