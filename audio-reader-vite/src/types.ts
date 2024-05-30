export type MediaChoice = {
  name: string;
  audioFile: string;
  audioType: string;
  transcriptFile: string;
  markupFile: string;
};

export type TranscriptCue = {
  id: string;
  startTime: number;
  text: string;
};

export type MediaContextType = {
  mediaChoices: MediaChoice[];
  selectedMediaId: number;
  setSelectedMediaId: (id: number) => void;
  selectedMedia: MediaChoice; // | undefined;
  transcript: TranscriptCue[];
  setTranscript: (cues: TranscriptCue[]) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
};
