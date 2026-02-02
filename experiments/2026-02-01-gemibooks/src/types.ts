export interface AudioFile {
  path: string; // Relative to root
  absolutePath: string;
  size: number;
}

export interface AudioMetadata extends AudioFile {
  duration: number; // seconds
  bitrate: number; // kbps
  codec: string;
  title?: string;
  artist?: string;
  error?: string;
}

export interface ScanOptions {
  rootPath: string;
  concurrency: number;
  json: boolean;
}
