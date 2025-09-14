import React, { useState } from 'react';
import { QueueManager } from '@core/queue/QueueManager';
import { PresetsStore } from '@core/presets/PresetsStore';
import { HistoryStore } from '@core/history/HistoryStore';
import { GenerationRequest } from '@core/types';
import { kv } from '../../core/storage/KV';

export function Generate({queue, presets, history}:{queue:QueueManager, presets:PresetsStore, history:HistoryStore}){
  const simple = kv.get('ui.simple') !== '0';
  const [engine, setEngine] = useState<'google'|'sandbox'|'nanobanana'|'flux'>(simple ? 'google' : 'google');
  const [prompt, setPrompt] = useState(''); const [negative, setNegative] = useState('');
  const [strength, setStrength] = useState(0.7); const [seed, setSeed] = useState<number | ''>('');
  const [refWeight, setRefWeight] = useState(0);
  // NEW: capture and display detailed errors
  const [lastError, setLastError] = useState<string | null>(null);

  // NEW: normalize preset model names (e.g., "gemini-...") into supported engines
  const normEngine = (m: any): 'google'|'sandbox'|'nanobanana'|'flux' => {
    const s = (m ?? '').toString().toLowerCase();
    if (s === 'google' || s === 'sandbox' || s === 'nanobanana' || s === 'flux') return s as any;
    if (s.includes('gemini')) return 'google';
    return 'google';
  };

  // NEW: format rich error info for display
  const describeError = (err: any) => {
    try {
      const info = {
        message: err?.message || String(err),
        name: err?.name,
        code: err?.code,
        status: err?.status ?? err?.response?.status,
        statusText: err?.statusText ?? err?.response?.statusText,
        errno: err?.errno,
        syscall: err?.syscall,
        hostname: err?.hostname,
        cause: err?.cause?.message || err?.cause,
      };
      return JSON.stringify(info, null, 2);
    } catch {
      return String(err);
    }
  };

  // NEW: quick connectivity probe to expose DNS/TLS/proxy issues
  const testGoogle = async () => {
    setLastError(null);
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1/models', { method: 'GET' });
      setLastError(`Test status: ${res.status} ${res.statusText}`);
    } catch (e) {
      setLastError(describeError(e));
    }
  };

  const onQueue = () => {
    // @ts-ignore
    const guard = (window as any).__AIBP_GUARD__;
    if (guard && !guard.canSpend(1)) { try { alert('Daily budget reached. Adjust in Settings.'); } catch {}; return; }
    const req: GenerationRequest = { engine, prompt, negative, strength, refWeight, seed: seed === '' ? null : Number(seed), refImage: null, region: null };
    setLastError(null);
    // ...existing code...
    try {
      history.add(req);
      const r: any = queue.add(req);
      if (r && typeof r.catch === 'function') {
        r.catch((e: any) => setLastError(describeError(e)));
      }
      if (guard) guard.spend(1);
    } catch (e) {
      setLastError(describeError(e));
    }
  };

  const ps = presets.list();
  const engineOptions = simple ? (
    <>
      <option value="google">Google (Gemini image)</option>
      <option value="sandbox">Sandbox (no API)</option>
    </>
  ) : (
    <>
      <option value="google">Google (Gemini image)</option>
      <option value="nanobanana">Nano Banana</option>
      <option value="flux">Flux</option>
      <option value="sandbox">Sandbox (no API)</option>
    </>
  );

  return (
    <div>
      <div className="row">
        <label>Engine</label>
        <select value={engine} onChange={e=>setEngine(e.target.value as any)}>
          {engineOptions}
        </select>
        <span className="badge">MVP</span>
      </div>
      <div><label>Prompt</label><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} /></div>
      <div><label>Negative</label><textarea value={negative} onChange={e=>setNegative(e.target.value)} /></div>
      <div className="row">
        <label>Strength</label><input type="number" step="0.05" min="0" max="1" value={strength} onChange={e=>setStrength(parseFloat(e.target.value))}/>
        <label>Seed</label><input type="number" value={seed} onChange={e=>setSeed(e.target.value===''? '': Number(e.target.value))}/>
      </div>
      <div className="row">
        <label>Ref weight</label><input type="number" min="0" max="100" value={refWeight} onChange={e=>setRefWeight(parseInt(e.target.value||'0'))}/>
      </div>
      <div className="row">
        <button onClick={onQueue}>Add to Queue</button>
        <select onChange={(e)=>{
          const p = ps.find(x=>x.name===e.target.value); if(!p) return;
          setPrompt(p.positive);
          setNegative(p.negative || '');
          setStrength(p.strength ?? 0.7);
          // NEW: normalize preset model -> supported engine
          setEngine(normEngine((p as any).model));
          setRefWeight((p as any).ref_weight ?? 0);
          if (typeof p.seed === 'number') setSeed(p.seed); else setSeed('');
        }}>
          <option value="">Load preset…</option>
          {ps.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        {/* NEW: quick connectivity test */}
        <button onClick={testGoogle}>Test Google</button>
      </div>
      {/* NEW: show last error details to pinpoint root cause */}
      {lastError && (
        <pre className="error" style={{ whiteSpace: 'pre-wrap' }}>{lastError}</pre>
      )}
    </div>
  );
}