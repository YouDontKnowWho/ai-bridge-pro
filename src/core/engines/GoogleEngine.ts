import { Engine } from './Engine';
import { GenerationRequest, GenerationResult } from '../types';
import fetch from 'cross-fetch';

interface GeminiPart { text?: string; inline_data?: { mime_type: string; data: string } }

export class GoogleEngine implements Engine {
  name = 'google';
  constructor(private apiKey: string, private modelId = 'gemini-2.5-flash-image-preview', private timeoutMs = 20000){}

  private endpoint(){
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const parts: GeminiPart[] = [];
    const text = req.negative ? `${req.prompt}\nNegative: ${req.negative}` : req.prompt;
    parts.push({ text });

    const body:any = {
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['IMAGE'] }
    };

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await (fetch as any)(this.endpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Google ${res.status}`);
      const json = await res.json();
      // Try common shapes
      const b64 = json?.candidates?.[0]?.content?.parts?.find((p:any)=>p?.inline_data)?.inline_data?.data
        || json?.images?.[0]?.image?.bytesBase64Encoded;
      if (!b64) throw new Error('No image in response');
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return { image: bytes.buffer, meta: { raw: json } };
    } catch (e:any) {
      const reason = e?.name === 'AbortError' || String(e).includes('timeout') ? 'timeout' : 'network';
      throw new Error(`Network request failed (${reason})`);
    } finally { clearTimeout(to); }
  }
}