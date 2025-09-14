import React, { useEffect, useState } from 'react';
import { QueueManager, Job } from '@core/queue/QueueManager';

export function QueuePanel({queue}:{queue:QueueManager}){
  const [jobs, setJobs] = useState<Job[]>(queue.list());
  useEffect(()=>{ const fn = ()=> setJobs(queue.list()); queue.subscribe(fn); return ()=>{}; }, [queue]);

  return (
    <div>
      <div className="row"><button onClick={()=>queue.clearFinished()}>Clear finished</button></div>
      <div className="scroll">
        {jobs.map(j => (
          <div key={j.id} className="list-item">
            <div><b>{j.status.toUpperCase()}</b> – {j.req.engine} {j.attempts ? <span className="badge">attempts: {j.attempts}</span> : null}</div>
            <div>{j.req.prompt.slice(0,80)}</div>
            {j.error && <div style={{color:'crimson'}}>Error: {j.error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}