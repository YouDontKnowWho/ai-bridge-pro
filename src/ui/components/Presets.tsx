import React, { useState } from 'react';
import { PresetsStore, Preset } from '@core/presets/PresetsStore';

export function PresetsPanel({presets}:{presets:PresetsStore}){
  const [list, setList] = useState<Preset[]>(presets.list());
  const save = ()=> { presets.save(list); alert('Saved'); };

  const importJson = async (ev:any)=>{
    const file = ev.target.files[0]; if(!file) return;
    const text = await file.text(); const arr = JSON.parse(text); setList(arr);
  };
  const exportJson = ()=>{
    const blob = new Blob([JSON.stringify(list, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'presets.json'; a.click();
  };

  return (
    <div>
      <div className="row">
        <button onClick={()=>{ presets.reset(); setList(presets.list()); }}>Reset to defaults</button>
        <button onClick={save}>Save</button>
        <button onClick={exportJson}>Export</button>
        <input type="file" accept="application/json" onChange={importJson} />
      </div>
      <div className="scroll">
        {list.map((p,idx)=>(
          <div className="list-item" key={idx}>
            <div className="row"><b>{p.name}</b><span className="badge">{p.model}</span></div>
            <div>{p.positive}</div>
          </div>
        ))}
      </div>
    </div>
  );
}