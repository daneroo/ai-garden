export type DigestAlgorithm = "sha1" | "sha256";

export type DigestRecord = {
  path: string;
  digest: string;
  size: number;
  mtime: string;
};

export type ScanStats = {
  files: number;
  bytes: number;
  mismatches: number;
  missing: number;
  extra: number;
  startTime: Date;
  endTime: Date;
};
