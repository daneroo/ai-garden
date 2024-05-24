import React, {
  useMemo,
  useState,
} from 'react';

export type MediaChoice = {
  name: string;
  audioFile: string;
  audioType: string;
  transcriptFile: string;
  markupFile: string;
};

export type MediaSelectorProps = {
  mediaChoices: MediaChoice[];
  onMediaChange?: (media: MediaChoice) => void; // Optional onMediaChange handler
};

function useMediaSelectorInternal(mediaChoices: MediaChoice[]) {
  const [selectedMediaId, setSelectedMediaId] = useState(0);

  const selectedMedia = useMemo(
    () => mediaChoices[selectedMediaId],
    [mediaChoices, selectedMediaId]
  );

  const selectMedia = (index: number) => {
    setSelectedMediaId(index);
  };

  return {
    selectedMedia,
    selectMedia,
  };
}

export function MediaSelector({
  mediaChoices,
  onMediaChange,
}: MediaSelectorProps) {
  const { selectMedia } = useMediaSelectorInternal(mediaChoices);

  const handleMediaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndex = Number(e.target.value);
    selectMedia(newIndex);
    if (onMediaChange) {
      onMediaChange(mediaChoices[newIndex]);
    }
  };

  return (
    <div>
      <span style={{ fontSize: "1.2rem" }}>Select Media:</span>
      <select onChange={handleMediaChange} style={{ fontSize: "1.2rem" }}>
        {mediaChoices.map((m, index) => (
          <option key={index} value={index}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
