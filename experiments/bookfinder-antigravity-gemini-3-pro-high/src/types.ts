export interface AudiobookMetadata {
  path: string; // relative to root
  filename: string;
  size: number;
  duration: number; // seconds
  bitrate: number; // kbps
  codec: string;
  title?: string;
  artist?: string;
  error?: string;
}

export interface ScanProgress {
  total: number;
  processed: number;
  running: number;
  currentFiles: string[];
}
