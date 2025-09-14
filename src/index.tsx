import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Generate } from './ui/components/Generate';
import { QueuePanel } from './ui/components/Queue';
import { HistoryPanel } from './ui/components/History';
import { PresetsPanel } from './ui/components/Presets';
import { SettingsPanel } from './ui/components/Settings';
import { QueueManager } from './core/queue/QueueManager';
import { PresetsStore } from './core/presets/PresetsStore';
import { HistoryStore } from './core/history/HistoryStore';
import { NanoBananaEngine } from './core/engines/NanoBananaEngine';
import { FluxEngine } from './core/engines/FluxEngine';
import { GoogleEngine } from './core/engines/GoogleEngine';
import { kv } from './core/storage/KV';
import { BudgetGuard } from './core/guards/BudgetGuard';

const guard = new BudgetGuard();

function renderError(err: any){
  const el = document.getElementById('root');
  if (!el) return;
  const pre = document.createElement('pre');
  pre.textContent = 'Startup error:\n' + (err?.stack || String(err));
  pre.style.color = 'salmon';
  pre.style.whiteSpace = 'pre-wrap';
  el.innerHTML = '';
  el.appendChild(pre);
}

try {
  const queue = new QueueManager();
  const presets = new PresetsStore();
  const history = new HistoryStore();

  queue.setEngineFactory((name: string) => {
    if (name === 'sandbox') {
      return { generate: async (req) => {
        await new Promise(r=>setTimeout(r, 300));
        const bytes = new Uint8Array([137,80,78,71,1,2,3,4]).buffer; // fake PNG-ish bytes
        return { image: bytes, meta: { sandbox: true, prompt: req.prompt } };
      }};
    }
    if (name === 'nanobanana') {
      const url = kv.get('nano.url');
      const key = kv.get('nano.key');
      const eng = new NanoBananaEngine(url, key);
      return { generate: (req) => eng.generate(req) };
    }
    if (name === 'google') {
      const key = kv.get('google.key');
      const model = kv.get('google.model') || 'gemini-2.5-flash-image-preview';
      const eng = new GoogleEngine(key, model);
      return { generate: (req) => eng.generate(req) };
    }
    const url = kv.get('flux.url');
    const key = kv.get('flux.key');
    const eng = new FluxEngine(url, key);
    return { generate: (req) => eng.generate(req) };
  });

  queue.setErrorNotifier((msg)=>{ try { alert(msg); } catch { /* noop */ } });

  function App(){
    const [tab, setTab] = useState<'gen'|'queue'|'hist'|'presets'|'settings'>('gen');
    return (
      <div className="panel">
        <div className="tabs">
          <div className={'tab ' + (tab==='gen'?'active':'')} onClick={()=>setTab('gen')}>Generate</div>
          <div className={'tab ' + (tab==='queue'?'active':'')} onClick={()=>setTab('queue')}>Queue</div>
          <div className={'tab ' + (tab==='hist'?'active':'')} onClick={()=>setTab('hist')}>History</div>
          <div className={'tab ' + (tab==='presets'?'active':'')} onClick={()=>setTab('presets')}>Presets</div>
          <div className={'tab ' + (tab==='settings'?'active':'')} onClick={()=>setTab('settings')}>Settings</div>
        </div>
        {tab==='gen' && <Generate queue={queue} presets={presets} history={history} />}
        {tab==='queue' && <QueuePanel queue={queue} />}
        {tab==='hist' && <HistoryPanel history={history} queue={queue} />}
        {tab==='presets' && <PresetsPanel presets={presets} />}
        {tab==='settings' && <SettingsPanel />}
      </div>
    );
  }
  // expose guard to window for Generate to consult
  // @ts-ignore
  window.__AIBP_GUARD__ = guard;

  const root = createRoot(document.getElementById('root')!);
  root.render(<App/>);
} catch (e) { renderError(e); }

window.addEventListener('error', (ev)=> renderError(ev.error || ev.message));
window.addEventListener('unhandledrejection', (ev:any)=> renderError(ev.reason));