import { JsonStorage } from '@core/storage/Storage';
import { GenerationRequest } from '@core/types';

export interface HistoryItem { ts: number; req: GenerationRequest; note?: string; }

export class HistoryStore {
  private key = 'history.v1';
  private max = 50;
  private store = new JsonStorage();

  add(req: GenerationRequest, note?: string){
    const list = this.store.get<HistoryItem[]>(this.key, []);
    list.unshift({ ts: Date.now(), req, note });
    this.store.set(this.key, list.slice(0, this.max));
  }
  all(): HistoryItem[] { return this.store.get<HistoryItem[]>(this.key, []); }
  clear(){ this.store.set(this.key, []); }
}