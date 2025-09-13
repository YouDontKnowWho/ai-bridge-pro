import React, { useState } from 'react';
import { QueueManager } from '@core/queue/QueueManager';
import { PresetsStore } from '@core/presets/PresetsStore';
import { HistoryStore } from '@core/history/HistoryStore';
import { GenerationRequest } from '@core/types';

export function Generate({queue, presets, history}:{queue:QueueManager, presets:PresetsStore, history:HistoryStore}){
  const [engine, setEngine] = useState<'nanobanana'|'flux'>('nanobanana');
  const [prompt, setPrompt] = useState(''); const [negative, setNegative] = useState('');
  const [strength, setStrength] = useState(0.7); const [seed, setSeed] = useState<number | ''>('');
  const [refWeight, setRefWeight] = useState(0);

  const onQueue = () => {
    const req: GenerationRequest = {
      engine, prompt, negative, strength, refWeight,
      seed: seed === '' ? null : Number(seed),
      refImage: null, region: null
    };
    history.add(req); queue.add(req);
  };

  const ps = presets.list();

  return (
    <div>
      <div className="row">
        <label>Engine</label>
        <select value={engine} onChange={e=>setEngine(e.target.value as any)}>
          <option value="nanobanana">Nano Banana</option>
          <option value="flux">Flux</option>
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
          setPrompt(p.positive); setNegative(p.negative || ''); setStrength(p.strength ?? 0.7);
        }}>
          <option value="">Load preset…</option>
          {ps.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
      </div>
    </div>
  );
}