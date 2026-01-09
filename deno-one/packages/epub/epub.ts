export interface EpubMetadata {
  title: string;
  author: string;
  chapters: string[];
}

export function getMetadata(_path: string): EpubMetadata {
  // Minimal stub - extract EPUB metadata
  return {
    title: "Untitled",
    author: "Unknown",
    chapters: [],
  };
}
