import { v4 as uuid } from 'uuid';
import { GenerationRequest, GenerationResult } from '@core/types';

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';
export interface Job {
  id: string;
  req: GenerationRequest;
  status: JobStatus;
  result?: GenerationResult;
  error?: string;
}

type EngineFactory = (name: string) => {
  generate: (req: GenerationRequest) => Promise<GenerationResult>;
};

export class QueueManager {
  private jobs: Job[] = [];
  private running = false;
  private engineFactory: EngineFactory | null = null;
  private listeners: Array<() => void> = [];

  setEngineFactory(factory: EngineFactory){ this.engineFactory = factory; }
  subscribe(fn: () => void){ this.listeners.push(fn); }
  private emit(){ this.listeners.forEach(fn => fn()); }

  add(req: GenerationRequest): string {
    const job: Job = { id: uuid(), req, status: 'pending' };
    this.jobs.push(job);
    this.run();
    this.emit();
    return job.id;
  }
  list(): Job[] { return [...this.jobs]; }
  clearFinished(){ this.jobs = this.jobs.filter(j => !(j.status==='done' || j.status==='failed')); this.emit(); }

  private async run(){
    if(this.running) return;
    this.running = true;
    try {
      while(true){
        const next = this.jobs.find(j => j.status === 'pending');
        if(!next) break;
        next.status = 'running'; this.emit();
        try {
          if(!this.engineFactory) throw new Error('Engine factory not set');
          const engine = this.engineFactory(next.req.engine);
          const res = await engine.generate(next.req);
          next.result = res; next.status = 'done';
        } catch (err:any){
          next.error = err?.message || String(err);
          next.status = 'failed';
        }
        this.emit();
      }
    } finally {
      this.running = false; this.emit();
    }
  }
}