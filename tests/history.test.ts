import { HistoryStore } from '../src/core/history/HistoryStore';

test('history keeps last 50', () => {
  const h = new HistoryStore();
  for(let i=0;i<80;i++){
    h.add({engine:'nanobanana', prompt:String(i), negative:'', seed:null, strength:0.7, refImage:null, refWeight:0, region:null});
  }
  const all = h.all();
  expect(all.length).toBe(50);
  expect(all[0].req.prompt).toBe('79');
  expect(all[49].req.prompt).toBe('30');
});