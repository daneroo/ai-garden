export interface Book {
  id: string; // SHA-1 of m4b basename
  title: string;
  author?: string;
  dirPath: string; // Relative to AUDIOBOOKS_ROOT
  coverPath?: string; // Relative to AUDIOBOOKS_ROOT
  audioFile: string; // Relative to dirPath
  epubFile?: string; // Relative to dirPath
  duration: number; // seconds
  size: number; // bytes
}

export interface BookScanResult {
  books: Book[];
  errors: string[];
}
