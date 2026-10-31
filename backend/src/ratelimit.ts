// A token bucket for the whole process, not per caller: the backend never looks at who is
// asking, so it can't tell people apart, and it doesn't try to. The bucket just bounds what one
// instance will do in a minute, which with Cloud Run's instance cap bounds the bill.
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(private readonly perMinute: number, private readonly now: () => number = Date.now) {
    this.tokens = perMinute;
    this.last = now();
  }

  /** Takes a token if one is there. */
  take(): boolean {
    const t = this.now();
    this.tokens = Math.min(this.perMinute, this.tokens + ((t - this.last) / 60_000) * this.perMinute);
    this.last = t;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
