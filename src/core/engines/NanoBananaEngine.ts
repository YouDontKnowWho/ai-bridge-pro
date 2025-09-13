import { Engine } from './Engine';
import { GenerationRequest, GenerationResult } from '../types';
import fetch from 'cross-fetch';

export class NanoBananaEngine implements Engine {
  name = 'nanobanana';
  constructor(private apiUrl: string, private apiKey: string){}
  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const payload:any = {
      prompt: req.prompt,
      negative: req.negative || '',
      seed: req.seed ?? null,
      strength: req.strength ?? 0.7,
      ref_weight: req.refWeight ?? 0
    };
    const f:any = (globalThis as any).fetch || fetch;
    const res = await f(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error(`NanoBanana ${res.status}`);
    const json = await res.json();
    const b64 = json.image;
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return { image: bytes.buffer, meta: { raw: json } };
  }
}