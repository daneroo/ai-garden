import { useMedia } from '../hooks/useMedia';

export function Markup() {
  const { selectedMedia } = useMedia();

  return (
    <>
      <h5>Markup for {selectedMedia.markupFile}</h5>
      {/* 100 copies of : this is a line */}
      {Array.from({ length: 100 }).map((_, index) => (
        <div key={index}>
          This is a line that is long enough to balance the transcript
        </div>
      ))}
    </>
  );
}
