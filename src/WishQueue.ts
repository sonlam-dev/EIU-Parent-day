import type { Wish } from './types';
export class WishQueue {
  private seen: Set<string> | null = null;
  private pending: Wish[] = [];
  ingest(snapshot: Wish[]): { initial: boolean; latest?: Wish } {
    const approved = [...new Map(snapshot.filter(w => w.status === 'approved').map(w => [w.id,w])).values()];
    const allowed = new Set(approved.map(w => w.id));
    this.pending = this.pending.filter(w => allowed.has(w.id));
    if (!this.seen) { this.seen = new Set(allowed); return { initial:true,latest:approved[0] }; }
    const added = approved.filter(w => !this.seen!.has(w.id)).sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
    this.seen = allowed; this.pending.push(...added);
    return { initial:false };
  }
  next() { return this.pending.shift(); }
}
