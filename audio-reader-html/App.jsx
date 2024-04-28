const audioFile = "media/theroadnottaken.mp3";
const audioType = "audio/mp3";
const transcriptFile = "media/theroadnottaken.vtt";
// const audioFile = "media/thebladeitself.m4b";
// const audioType = "audio/mp4";
// const transcriptFile = "media/thebladeitself.vtt";

ReactDOM.render(<App />, document.getElementById("root"));

function App() {
  const audioPlayerRef = React.useRef(null);
  const trackRef = React.useRef(null);

  const [duration, setDuration] = React.useState(100);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [transcript, setTranscript] = React.useState([]);

  function sliderChange(e) {
    const newTime = e.target.value;
    setCurrentTime(newTime);
    audioPlayerRef.current.currentTime = newTime;
  }

  React.useEffect(() => {
    function handleMetadataLoaded() {
      const duration = audioPlayerRef.current.duration;
      console.log("Duration loaded", duration);
      setDuration(duration);
    }

    function handleTimeUpdate() {
      setCurrentTime(audioPlayerRef.current.currentTime);
    }

    function handleTrackLoad() {
      const track = trackRef.current.track;
      const cues = Array.from(track.cues);
      const cueRefs = cues.map(() => React.createRef());
      setTranscript(
        cues.map((cue, index) => ({
          id: `${cue.startTime}-${cue.endTime}`,
          text: cue.text,
          ref: cueRefs[index],
        }))
      );
    }
    audioPlayerRef.current.addEventListener(
      "loadedmetadata",
      handleMetadataLoaded
    );
    audioPlayerRef.current.ontimeupdate = handleTimeUpdate;
    trackRef.current.addEventListener("load", handleTrackLoad);

    // Clean up function
    return () => {
      audioPlayerRef.current.removeEventListener(
        "loadedmetadata",
        handleMetadataLoaded
      );
      audioPlayerRef.current.ontimeupdate = null;
      trackRef.current.removeEventListener("load", handleTrackLoad);
    };
  }, []);

  React.useEffect(() => {
    const track = trackRef.current.track;
    const cues = Array.from(track.cues);

    cues.forEach((cue, index) => {
      cue.onenter = () => {
        transcript[index].ref.current.classList.add("current");
        transcript[index].ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      };
      cue.onexit = () => {
        transcript[index].ref.current.classList.remove("current");
      };
    });

    // Clean up function
    return () => {
      cues.forEach((cue) => {
        cue.onenter = null;
        cue.onexit = null;
      });
    };
  }, [transcript, trackRef]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "calc(var(--vh) * 100)",
        justifyContent: "space-between",
        gap: "1.2rem",
      }}
    >
      {/* Media controls */}
      <div>
        <h4>controls</h4>
        <audio ref={audioPlayerRef} controls>
          <source src={audioFile} type={audioType} />
          <track
            ref={trackRef}
            src={transcriptFile}
            kind="subtitles"
            srcLang="en"
            default
          />
        </audio>
        <div>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            value={currentTime}
            max={duration}
            onChange={sliderChange}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      {/* Transcript Area */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        {/* This is where the transcript goes */}
        {transcript.map((cue) => (
          <div className={"caption"} key={cue.id} ref={cue.ref}>
            {cue.text}
          </div>
        ))}{" "}
      </div>
      <div>
        <h4>footer</h4>
      </div>
    </div>
  );
}

function formatTime(secs) {
  if (isNaN(secs)) return "0:00.00";
  const fl = Math.floor;
  const H = 3600;
  const hours = secs >= H ? `${fl(secs / H)}:` : "";
  const minutes = fl((secs % H) / 60)
    .toFixed(0)
    .padStart(2, "0");
  const seconds = (secs % 60).toFixed(2).padStart(5, "0");
  return `${hours}${minutes}:${seconds}`;
}
