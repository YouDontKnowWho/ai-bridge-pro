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

const queue = new QueueManager();
const presets = new PresetsStore();
const history = new HistoryStore();

queue.setEngineFactory((name: string) => {
  if (name === 'nanobanana') {
    const url = localStorage.getItem('nano.url') || '';
    const key = localStorage.getItem('nano.key') || '';
    const eng = new NanoBananaEngine(url, key);
    return { generate: (req) => eng.generate(req) };
  }
  const url = localStorage.getItem('flux.url') || '';
  const key = localStorage.getItem('flux.key') || '';
  const eng = new FluxEngine(url, key);
  return { generate: (req) => eng.generate(req) };
});

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
const root = createRoot(document.getElementById('root')!);
root.render(<App/>);