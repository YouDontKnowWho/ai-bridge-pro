import { JsonStorage } from '@core/storage/Storage';
import defaults from '../../../presets/presets.v1.json';

export interface Preset {
  name: string;
  model: 'nanobanana' | 'flux';
  positive: string;
  negative?: string;
  strength?: number;
  ref_weight?: number;
  seed?: number | null;
}

export class PresetsStore {
  private key = 'presets.v1';
  private store = new JsonStorage();

  list(): Preset[] {
    const user = this.store.get<Preset[] | null>(this.key, null);
    if (user && user.length) return user;
    return (defaults as unknown as Preset[]);
  }
  save(list: Preset[]){ this.store.set(this.key, list); }
  reset(){ this.store.set(this.key, (defaults as unknown as Preset[])); }
}