import { readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { AudiobookMetadata, ScanProgress } from "./types";

const EXTENSIONS = new Set([".m4b", ".mp3"]);

export class Scanner {
  private rootPath: string;
  private concurrency: number;
  private files: string[] = [];
  private results: AudiobookMetadata[] = [];
  private onProgress?: (progress: ScanProgress) => void;

  constructor(rootPath: string, concurrency: number = 8) {
    this.rootPath = rootPath;
    this.concurrency = concurrency;
  }

  async scan(onProgress?: (progress: ScanProgress) => void): Promise<AudiobookMetadata[]> {
    this.onProgress = onProgress;
    this.files = [];
    this.results = [];

    // 1. Find all files
    await this.findFiles(this.rootPath);

    // Sort files by path for stable processing order if feasible

    // 2. Process with worker pool
    await this.processFiles();

    // 3. Sort results
    this.results.sort((a, b) => a.path.localeCompare(b.path));

    return this.results;
  }

  private async findFiles(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; // Skip hidden
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.findFiles(fullPath);
      } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        this.files.push(fullPath);
      }
    }
  }

  private async processFiles() {
    let nextIndex = 0;
    const total = this.files.length;
    let processed = 0;
    let running = 0;
    const currentFiles = new Set<string>();

    const updateProgress = () => {
      if (this.onProgress) {
        this.onProgress({
          total,
          processed,
          running,
          currentFiles: Array.from(currentFiles),
        });
      }
    };

    const worker = async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= total) break;

        const filePath = this.files[index];
        const relativePath = relative(this.rootPath, filePath);

        running++;
        currentFiles.add(relativePath);
        updateProgress();

        try {
          const metadata = await this.probeFile(filePath, relativePath);
          this.results.push(metadata);
        } catch (error) {
          console.error(`Failed to probe ${relativePath}`, error);
        } finally {
          running--;
          processed++;
          currentFiles.delete(relativePath);
          updateProgress();
        }
      }
    };

    const workers = Array.from({ length: Math.min(this.concurrency, total) }, () => worker());
    await Promise.all(workers);
  }

  private async probeFile(filePath: string, relativePath: string): Promise<AudiobookMetadata> {
    const fileStat = await stat(filePath);

    const cmd = [
      "ffprobe",
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ];

    try {
      const proc = Bun.spawn(cmd, {
        stdout: "pipe",
        stderr: "pipe",
      });

      // Timeout not implemented for simplicity and due to Bun types, assuming it finishes or user kills it.
      // For real robustness, check Bun's approach to timeout.

      const text = await new Response(proc.stdout).text();
      await proc.exited;

      if (text.trim().length === 0) {
        throw new Error("Empty output from ffprobe");
      }

      const data = JSON.parse(text);
      const format = data.format || {};
      const tags = format.tags || {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioStream = data.streams?.find((s: any) => s.codec_type === "audio");

      const duration = parseFloat(format.duration || "0");
      const bitrate = parseInt(format.bit_rate || "0", 10) / 1000; // kbps
      const codec = audioStream?.codec_name || "unknown";

      return {
        path: relativePath,
        filename: join(relativePath).split("/").pop() || relativePath,
        size: fileStat.size,
        duration,
        bitrate,
        codec: String(codec),
        title: tags.title || tags.TITLE,
        artist: tags.artist || tags.ARTIST || tags.album_artist || tags.ALBUM_ARTIST,
      };
    } catch (e: unknown) {
      return {
        path: relativePath,
        filename: join(relativePath).split("/").pop() || relativePath,
        size: fileStat.size,
        duration: 0,
        bitrate: 0,
        codec: "error",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
