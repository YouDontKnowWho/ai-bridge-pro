const memory = new Map<string,string>();

export class JsonStorage {
  get<T>(key:string, fallback:T): T {
    try {
      const raw = typeof localStorage === 'undefined' ? memory.get(key) ?? null : localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch { return fallback; }
  }
  set<T>(key:string, value:T){
    if (typeof localStorage === 'undefined') memory.set(key, JSON.stringify(value));
    else localStorage.setItem(key, JSON.stringify(value));
  }
}