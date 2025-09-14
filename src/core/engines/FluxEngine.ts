import { Engine } from './Engine';
import { GenerationRequest, GenerationResult } from '../types';
import fetch from 'cross-fetch';

export class FluxEngine implements Engine {
  name = 'flux';
  constructor(private apiUrl: string, private apiKey: string, private timeoutMs = 20000){}
  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const payload:any = {
      prompt: req.prompt,
      negative: req.negative || '',
      seed: req.seed ?? null,
      strength: req.strength ?? 0.7,
      ref_weight: req.refWeight ?? 0
    };
    const f:any = (globalThis as any).fetch || fetch;
    const ctrl = new AbortController();
    const to = setTimeout(()=> ctrl.abort('timeout'), this.timeoutMs);
    try {
      const res = await f(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      if(!res.ok) throw new Error(`Flux ${res.status}`);
      const json = await res.json();
      const b64 = json.image;
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return { image: bytes.buffer, meta: { raw: json } };
    } catch (e:any){
      const reason = e?.name === 'AbortError' || String(e).includes('timeout') ? 'timeout' : 'network';
      throw new Error(`Network request failed (${reason})`);
    } finally {
      clearTimeout(to);
    }
  }
}