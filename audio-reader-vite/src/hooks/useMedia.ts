import { useContext } from 'react';

import MediaContext from '../contexts/media-context';
import { MediaContextType } from '../types';

// Custom hook to use the MediaContext
export const useMedia = (): MediaContextType => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};
