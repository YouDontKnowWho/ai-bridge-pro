const mem = new Map<string,string>();

function hasLocalStorage(){
  try { return typeof localStorage !== 'undefined' && !!localStorage; } catch { return false; }
}

export const kv = {
  get(key:string): string {
    try { if (hasLocalStorage()) return localStorage.getItem(key) || ''; } catch {}
    return mem.get(key) || '';
  },
  set(key:string, val:string){
    try { if (hasLocalStorage()) { localStorage.setItem(key, val); return; } } catch {}
    mem.set(key, val);
  }
};