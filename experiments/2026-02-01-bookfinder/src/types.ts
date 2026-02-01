export type ProbeMetadata = {
  durationSeconds: number | null;
  bitrateKbps: number | null;
  codec: string | null;
  title: string | null;
  artist: string | null;
};

export type ScannedFile = {
  absPath: string;
  relPath: string;
  sizeBytes: number;
};

export type ProbedFile = ScannedFile & ProbeMetadata;
