import type { Wish } from './types.ts';
import { WishQueue } from './WishQueue.ts';

export const WISH_INTERVAL_MS=3600;
export class WishPresentation {
  private queue=new WishQueue();
  private shown=new Map<string,Wish>();
  private recent:string[]=[];
  ingest(snapshot:Wish[]) {
    const approved=[...new Map(snapshot.filter(w=>w.status==='approved').map(w=>[w.id,w])).values()];
    const {initial}=this.queue.ingest(approved);
    const allowed=new Map(approved.map(w=>[w.id,w]));
    for(const id of this.shown.keys()) {
      const updated=allowed.get(id);
      if(updated) this.shown.set(id,updated); else this.shown.delete(id);
    }
    if(initial) {
      const ordered=approved.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
      this.shown=new Map(ordered.map(w=>[w.id,w]));
      this.recent=ordered.slice(-5).map(w=>w.id);
    } else {
      this.recent=this.recent.filter(id=>this.shown.has(id));
      // Fill vacancies after moderation from the newest remaining presented wishes.
      const newest=[...this.shown.values()];
      this.recent=newest.slice(-5).map(w=>w.id);
    }
    return this.state();
  }
  next() {
    const wish=this.queue.next();
    if(!wish) return undefined;
    this.shown.set(wish.id,wish);
    this.recent=[...this.recent.filter(id=>id!==wish.id),wish.id].slice(-5);
    return {wish,...this.state()};
  }
  private state() {
    return {treeWishes:[...this.shown.values()],feed:this.recent.map(id=>this.shown.get(id)!)};
  }
}
