import { v4 as uuid } from 'uuid';
import { GenerationRequest, GenerationResult } from '@core/types';

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';
export interface Job {
  id: string;
  req: GenerationRequest;
  status: JobStatus;
  result?: GenerationResult;
  error?: string;
  attempts?: number;
}

type EngineFactory = (name: string) => {
  generate: (req: GenerationRequest) => Promise<GenerationResult>;
};

export class QueueManager {
  private jobs: Job[] = [];
  private running = false;
  private engineFactory: EngineFactory | null = null;
  private listeners: Array<() => void> = [];
  private maxRetries = 3;
  private backoffMs = 500;
  private maxBackoffMs = 30_000;
  private jitterRatio = 0.25;
  private retryClassifier?: (err: any) => boolean;
  private notify?: (msg:string)=>void;

  setEngineFactory(factory: EngineFactory){ this.engineFactory = factory; }
  subscribe(fn: () => void){ this.listeners.push(fn); }
  private emit(){ this.listeners.forEach(fn => fn()); }

  setRetryOptions(opts: { maxRetries?: number; backoffMs?: number; maxBackoffMs?: number; jitterRatio?: number }){
    if (typeof opts.maxRetries === 'number') this.maxRetries = Math.max(0, opts.maxRetries);
    if (typeof opts.backoffMs === 'number') this.backoffMs = Math.max(0, opts.backoffMs);
    if (typeof opts.maxBackoffMs === 'number') this.maxBackoffMs = Math.max(0, opts.maxBackoffMs);
    if (typeof opts.jitterRatio === 'number') this.jitterRatio = Math.min(Math.max(0, opts.jitterRatio), 1);
  }
  setErrorNotifier(fn: (msg:string)=>void){ this.notify = fn; }
  setRetryClassifier(fn: (err:any)=>boolean){ this.retryClassifier = fn; }

  add(req: GenerationRequest): string {
    const job: Job = { id: uuid(), req, status: 'pending', attempts: 0 };
    this.jobs.push(job);
    this.run();
    this.emit();
    return job.id;
  }
  list(): Job[] { return [...this.jobs]; }
  clearFinished(){ this.jobs = this.jobs.filter(j => !(j.status==='done' || j.status==='failed')); this.emit(); }

  private delay(ms:number){ return new Promise(res=>setTimeout(res, ms)); }
  private computeBackoffDelay(attempt: number){
    const base = this.backoffMs * Math.pow(2, Math.max(0, attempt - 1));
    const capped = Math.min(base, this.maxBackoffMs);
    const jitterSpan = capped * this.jitterRatio;
    const jitter = (Math.random() * 2 - 1) * jitterSpan; // +/- jitterRatio
    return Math.max(0, Math.floor(capped + jitter));
  }

  private isRetryable(err:any){
    try {
      if (this.retryClassifier) return !!this.retryClassifier(err);

      const status = err?.status ?? err?.response?.status ?? err?.cause?.status;
      if (typeof status === 'number') {
        if (status === 429) return true;
        if (status >= 500) return true;   // server/transient
        if (status === 408) return true;  // request timeout
        // 4xx that are auth/config should not retry
        if (status === 401 || status === 403 || status === 400 || status === 404) return false;
      }

      const code = String(err?.code ?? '').toUpperCase();
      if (['ETIMEDOUT','ESOCKETTIMEDOUT','ECONNRESET','ECONNABORTED','EAI_AGAIN','ENOTFOUND','EHOSTUNREACH','ENETUNREACH','ECONNREFUSED','EPIPE'].includes(code)) return true;

      const name = String(err?.name ?? '').toLowerCase();
      if (name.includes('timeout')) return true;

      const msg = (err?.message || String(err) || '').toLowerCase();
      return /429|too many|timeout|timed out|network error|socket hang up|temporary|rate limit|fetch failed|failed to fetch|cors|tls|proxy/i.test(msg);
    } catch {
      return false;
    }
  }

  private composeErrorMessage(err:any){
    const status = err?.status ?? err?.response?.status;
    const code = String(err?.code ?? '');
    const msg = err?.message || String(err) || 'Unknown error';
    if (status === 401 || status === 403) return `${msg} (auth). Check API key/credentials.`;
    if (status === 404 && /model|endpoint/i.test(msg)) return `${msg}. Verify model/endpoint name.`;
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return `${msg}. Check internet/DNS settings.`;
    return msg;
  }

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
          next.result = res; next.status = 'done'; next.error = undefined;
        } catch (err:any){
          const attempt = (next.attempts ?? 0) + 1;
          next.attempts = attempt;
          const rawMsg = err?.message || String(err);
          next.error = rawMsg;

          const shouldRetry = this.isRetryable(err) && (attempt <= this.maxRetries);
          if (shouldRetry) {
            const delayMs = this.computeBackoffDelay(attempt);
            if (attempt === 1 && this.notify) {
              this.notify(`Temporary error: ${rawMsg}. Retrying in ${delayMs} ms...`);
            } else if (this.notify) {
              this.notify(`Retry ${attempt}/${this.maxRetries} in ${delayMs} ms due to: ${rawMsg}`);
            }
            this.emit();
            await this.delay(delayMs);
            next.status = 'pending';
          } else {
            next.status = 'failed';
            next.error = this.composeErrorMessage(err);
          }
        }
        this.emit();
      }
    } finally {
      this.running = false; this.emit();
    }
  }
}