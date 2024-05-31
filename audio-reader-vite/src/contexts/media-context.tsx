import React, { createContext, ReactNode, useMemo, useState } from "react";

import { MediaChoice, MediaContextType, TranscriptCue } from "../types";

// Create the MediaContext
const MediaContext = createContext<MediaContextType | undefined>(undefined);

type MediaProviderProps = {
  children: ReactNode;
  mediaChoices: MediaChoice[];
};

// MediaProvider component to wrap around components that need access to the context
export const MediaProvider: React.FC<MediaProviderProps> = ({
  children,
  mediaChoices,
}) => {
  const [selectedMediaId, setSelectedMediaId] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptCue[]>([]);
  const [activeCues, setActiveCues] = useState<TranscriptCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  const selectedMedia = useMemo(
    () => mediaChoices[selectedMediaId],
    [mediaChoices, selectedMediaId]
  );

  return (
    <MediaContext.Provider
      value={{
        mediaChoices,
        selectedMediaId,
        setSelectedMediaId,
        selectedMedia,
        transcript,
        setTranscript,
        activeCues,
        setActiveCues,
        currentTime,
        setCurrentTime,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export default MediaContext;
