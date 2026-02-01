type ProgressLineOptions = {
  enabled?: boolean;
  minIntervalMs?: number;
};

export class ProgressLine {
  private readonly enabled: boolean;
  private readonly minIntervalMs: number;
  private lastWriteAt = 0;
  private lastText = "";

  constructor(opts?: ProgressLineOptions) {
    const isTty = Boolean(process.stderr.isTTY);
    this.enabled = opts?.enabled ?? isTty;
    this.minIntervalMs = opts?.minIntervalMs ?? 80;
  }

  update(text: string): void {
    if (!this.enabled) return;
    const now = Date.now();
    if (text === this.lastText && now - this.lastWriteAt < this.minIntervalMs) return;
    if (now - this.lastWriteAt < this.minIntervalMs) return;

    this.lastText = text;
    this.lastWriteAt = now;

    // Clear line and return carriage so we overwrite the same row.
    process.stderr.write(`\r\x1b[2K${text}`);
  }

  updateNow(text: string): void {
    if (!this.enabled) return;
    if (text === this.lastText) return;
    this.lastText = text;
    this.lastWriteAt = Date.now();
    process.stderr.write(`\r\x1b[2K${text}`);
  }

  done(finalText?: string): void {
    if (!this.enabled) return;
    if (finalText) {
      process.stderr.write(`\r\x1b[2K${finalText}\n`);
    } else {
      process.stderr.write("\r\x1b[2K\n");
    }
  }
}
