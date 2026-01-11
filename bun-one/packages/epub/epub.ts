export interface EpubMetadata {
  title: string;
  author: string;
  chapters: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getMetadata(_path: string): EpubMetadata {
  // Minimal stub - extract EPUB metadata
  return {
    title: "Untitled",
    author: "Unknown",
    chapters: [],
  };
}
