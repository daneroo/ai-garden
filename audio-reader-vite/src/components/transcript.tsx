import { useMedia } from '../hooks/useMedia';

export function Transcript() {
  const { transcript, setCurrentTime } = useMedia();

  return (
    <>
      <h5>Transcript</h5>

      {transcript.map((cue) => (
        <div
          key={cue.id}
          className={"caption"}
          onDoubleClick={() => {
            console.log("dbl click", cue);
            setCurrentTime(cue.startTime);
          }}
        >
          {cue.startTime.toFixed(2)}s - {cue.text}
        </div>
      ))}
    </>
  );
}
