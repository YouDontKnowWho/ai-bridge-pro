import React, { useEffect, useState } from 'react';
import { HistoryStore, HistoryItem } from '@core/history/HistoryStore';
import { QueueManager } from '@core/queue/QueueManager';

export function HistoryPanel({history, queue}:{history:HistoryStore, queue:QueueManager}){
  const [items, setItems] = useState<HistoryItem[]>(history.all());
  useEffect(()=>{ const i = setInterval(()=> setItems(history.all()), 800); return ()=> clearInterval(i); }, [history]);
  return (
    <div>
      <div className="row"><button onClick={()=>history.clear()}>Clear</button></div>
      <div className="scroll">
        {items.map((it, idx) => (
          <div key={idx} className="list-item">
            <div className="row">
              <span className="badge">{new Date(it.ts).toLocaleTimeString()}</span>
              <button onClick={()=>queue.add(it.req)}>Re-run</button>
            </div>
            <div><b>{it.req.engine}</b> {it.req.prompt.slice(0,100)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}