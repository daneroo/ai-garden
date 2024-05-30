import React from 'react';

import { useMedia } from '../hooks/useMedia';

export function MediaSelector() {
  const { mediaChoices, selectedMediaId, setSelectedMediaId, setTranscript } =
    useMedia();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTranscript([]);
    const newIndex = Number(event.target.value);
    setSelectedMediaId(newIndex);
  };

  return (
    <div>
      <span style={{ fontSize: "1.2rem" }}>Select Media:</span>
      <select
        onChange={handleChange}
        value={selectedMediaId}
        style={{ fontSize: "1.2rem" }}
      >
        {mediaChoices.map((media, index) => (
          <option key={index} value={index}>
            {media.name}
          </option>
        ))}
      </select>
    </div>
  );
}
