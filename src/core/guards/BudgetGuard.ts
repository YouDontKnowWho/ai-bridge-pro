import { kv } from '../storage/KV';

interface State { date: string; used: number; }

export class BudgetGuard {
  constructor(private key = 'budget.v1', private limitKey = 'limit.daily'){}

  private today(): string { return new Date().toISOString().slice(0,10); }
  private read(): State {
    try { return JSON.parse(kv.get(this.key)) as State; } catch { return { date: this.today(), used: 0 }; }
  }
  private write(s: State){ kv.set(this.key, JSON.stringify(s)); }
  private getLimit(): number { const v = parseInt(kv.get(this.limitKey)||'0', 10); return isNaN(v) ? 0 : Math.max(0, v); }

  canSpend(n=1): boolean {
    const limit = this.getLimit(); if (limit <= 0) return true;
    const t = this.today(); const st = this.read();
    const used = st.date === t ? st.used : 0;
    return (used + n) <= limit;
  }
  spend(n=1){
    const limit = this.getLimit(); if (limit <= 0) return;
    const t = this.today(); const st = this.read();
    const used = st.date === t ? st.used : 0;
    this.write({ date: t, used: used + n });
  }
  reset(){ this.write({ date: this.today(), used: 0 }); }
}