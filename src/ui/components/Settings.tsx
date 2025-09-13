import React, { useState } from 'react';

export function SettingsPanel(){
  const [nanoUrl, setNanoUrl] = useState(localStorage.getItem('nano.url') || '');
  const [nanoKey, setNanoKey] = useState(localStorage.getItem('nano.key') || '');
  const [fluxUrl, setFluxUrl] = useState(localStorage.getItem('flux.url') || '');
  const [fluxKey, setFluxKey] = useState(localStorage.getItem('flux.key') || '');

  const save = ()=>{
    localStorage.setItem('nano.url', nanoUrl);
    localStorage.setItem('nano.key', nanoKey);
    localStorage.setItem('flux.url', fluxUrl);
    localStorage.setItem('flux.key', fluxKey);
    alert('Saved');
  };

  return (
    <div>
      <h4>Engines</h4>
      <div>
        <label>Nano Banana URL</label><input value={nanoUrl} onChange={e=>setNanoUrl(e.target.value)} />
        <label>API Key</label><input value={nanoKey} onChange={e=>setNanoKey(e.target.value)} />
      </div>
      <div>
        <label>Flux URL</label><input value={fluxUrl} onChange={e=>setFluxUrl(e.target.value)} />
        <label>API Key</label><input value={fluxKey} onChange={e=>setFluxKey(e.target.value)} />
      </div>
      <div className="row"><button onClick={save}>Save</button></div>
      <p style={{fontSize:12,opacity:0.8}}>Keys stored locally in plugin sandbox.</p>
    </div>
  );
}