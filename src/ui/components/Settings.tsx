import React, { useState } from 'react';
import { kv } from '../../core/storage/KV';

export function SettingsPanel(){
  const [simple, setSimple] = useState(kv.get('ui.simple') !== '0');
  const [gKey, setGKey] = useState(kv.get('google.key'));
  const [gModel, setGModel] = useState(kv.get('google.model') || 'gemini-2.5-flash-image-preview');
  const [nanoUrl, setNanoUrl] = useState(kv.get('nano.url'));
  const [nanoKey, setNanoKey] = useState(kv.get('nano.key'));
  const [fluxUrl, setFluxUrl] = useState(kv.get('flux.url'));
  const [fluxKey, setFluxKey] = useState(kv.get('flux.key'));
  const [daily, setDaily] = useState(kv.get('limit.daily') || '0');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const save = ()=>{
    kv.set('ui.simple', simple ? '1' : '0');
    kv.set('google.key', gKey);
    kv.set('google.model', gModel);
    kv.set('nano.url', nanoUrl);
    kv.set('nano.key', nanoKey);
    kv.set('flux.url', fluxUrl);
    kv.set('flux.key', fluxKey);
    kv.set('limit.daily', String(parseInt(daily||'0',10) || 0));
    setTestMsg('Saved'); setTestOk(true);
  };

  const testGoogle = async ()=>{
    if (!gKey) { setTestMsg('Enter Google API Key first'); setTestOk(false); return; }
    setTesting(true); setTestMsg('Testing…'); setTestOk(null);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(gModel)}?key=${encodeURIComponent(gKey)}`;
    try {
      const t0 = Date.now();
      const res = await fetch(url);
      const ms = Date.now() - t0;
      if (!res.ok) { setTestMsg(`Failed: ${res.status}`); setTestOk(false); }
      else { const json = await res.json(); setTestMsg(`OK: ${json?.displayName || gModel} • ${ms} ms`); setTestOk(true); }
    } catch (e:any){ setTestMsg('Network error'); setTestOk(false); }
    finally { setTesting(false); }
  };

  const Status = () => (
    testMsg ? <div style={{ marginTop: 6, color: testOk===null? '#ccc' : (testOk? '#6cc070' : '#e57373') }}>{testMsg}</div> : null
  );

  if (simple) {
    return (
      <div>
        <h4>Quick setup</h4>
        <div>
          <label>Google API Key</label>
          <input value={gKey} onChange={e=>setGKey(e.target.value)} placeholder="Paste your key" />
        </div>
        <div className="row">
          <button onClick={save}>Save</button>
          <button onClick={testGoogle} disabled={testing}>{testing? 'Testing…' : 'Test connection'}</button>
        </div>
        <Status />
        <div style={{marginTop:8}}>
          <a href="#" onClick={(e)=>{e.preventDefault(); setSimple(false);}}>Show advanced settings</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4>Engines</h4>
      <div>
        <label>Google API Key</label><input value={gKey} onChange={e=>setGKey(e.target.value)} />
        <label>Google Model</label><input value={gModel} onChange={e=>setGModel(e.target.value)} />
        <button onClick={testGoogle} disabled={testing}>{testing? 'Testing…' : 'Test connection'}</button>
      </div>
      <Status />
      <div>
        <label>Nano Banana URL</label><input value={nanoUrl} onChange={e=>setNanoUrl(e.target.value)} />
        <label>API Key</label><input value={nanoKey} onChange={e=>setNanoKey(e.target.value)} />
      </div>
      <div>
        <label>Flux URL</label><input value={fluxUrl} onChange={e=>setFluxUrl(e.target.value)} />
        <label>API Key</label><input value={fluxKey} onChange={e=>setFluxKey(e.target.value)} />
      </div>
      <h4>Safeguards</h4>
      <div>
        <label>Daily job limit</label>
        <input type="number" min="0" value={daily} onChange={e=>setDaily(e.target.value)} />
        <span className="badge">0 = unlimited</span>
      </div>
      <div className="row"><button onClick={save}>Save</button></div>
      <div style={{marginTop:8}}>
        <a href="#" onClick={(e)=>{e.preventDefault(); setSimple(true);}}>Hide advanced settings</a>
      </div>
      <p style={{fontSize:12,opacity:0.8}}>Keys and limits stored locally in plugin sandbox.</p>
    </div>
  );
}