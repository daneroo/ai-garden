ReactDOM.render(<App />, document.getElementById("root"));

function App() {
  const mediaChoices = [
    {
      name: "The Road Not Taken",
      audioFile: "media/theroadnottaken.mp3",
      audioType: "audio/mp3",
      transcriptFile: "media/theroadnottaken.vtt",
      markupFile: "media/theroadnottaken.html",
    },
    {
      name: "The Blade Itself",
      audioFile: "media/thebladeitself.m4b",
      audioType: "audio/mp4",
      transcriptFile: "media/thebladeitself.vtt",
      markupFile: "media/thebladeitself.html",
    },
  ];

  const [selectedMediaId, setSelectedMediaId] = React.useState(1);
  const { audioFile, audioType, transcriptFile } =
    mediaChoices[selectedMediaId];

  const audioPlayerRef = React.useRef(null);
  const trackRef = React.useRef(null);

  const [duration, setDuration] = React.useState(100);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [transcript, setTranscript] = React.useState([]);
  const [markupContent, setMarkupContent] = React.useState("");

  const mediaChange = (id) => {
    setSelectedMediaId(id);
  };

  function sliderChange(e) {
    const newTime = e.target.value;
    setCurrentTime(newTime);
    audioPlayerRef.current.currentTime = newTime;
  }

  React.useEffect(() => {
    fetch(mediaChoices[selectedMediaId].markupFile)
      .then((response) => response.text())
      .then((data) => setMarkupContent(data));
  }, [selectedMediaId]);

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

    audioPlayerRef.current.load(); // Reload the audio element to apply new sources

    // Well this line cost me about 5 days of debugging
    // this is disabled by default, which won;t even trigger the loading of cues from the vtt file
    // needs to be set to "showing" or "hidden" to trigger cue loading on iPad/iPhone
    // console.log(`Track mode: ${trackRef.current.track.mode}`);
    trackRef.current.track.mode = "hidden"; // or "showing", as long as it does not remain "disabled"

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
  }, [selectedMediaId]);

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
  }, [selectedMediaId, transcript, trackRef]);

  // declare state for the markupContentHighlight
  const [markupContentHighlight, setMarkupContentHighlight] =
    React.useState("");

  // sync active cues with markup content (html)
  React.useEffect(() => {
    if (!markupContentHighlight) {
      setMarkupContentHighlight(markupContent);
    }
    const track = trackRef.current.track;
    function handleCueChange() {
      // What does it mean if there is more that one active cue????
      const cues = Array.from(track.activeCues);
      cues.forEach((cue, index) => {
        console.log(
          `Cue ${index + 1}/${cues.length}: [${cue.startTime},${cue.endTime}]`,
          cue.text
        );
        setMarkupContentHighlight(
          highlightCueInMarkupContent(cue.text, markupContent)
        );
      });
    }
    track.addEventListener("cuechange", handleCueChange);
    return () => {
      track.removeEventListener("cuechange", handleCueChange);
    };
  }, [trackRef, markupContent]);

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
      <div>
        {/* Media Selector */}
        <span style={{ fontSize: "1.2rem" }}>Select Media:</span>

        <select
          value={selectedMediaId}
          onChange={(e) => mediaChange(e.target.value)}
          style={{ fontSize: "1.2rem" }}
        >
          {mediaChoices.map((m, index) => (
            <option key={index} value={index}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        {/* Media controls */}
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
      {/* Two-Column Layout for Transcript and HTML Content */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          gap: "1rem", // Add a gap between the columns
          justifyContent: "space-between", // Add space between the columns
          paddingLeft: "1rem", // Add padding to the left of the container
          paddingRight: "1rem", // Add padding to the right of the container
        }}
      >
        {/* Transcript Column */}
        <div
          style={{
            width: "50%", // half of the container width
            overflowY: "auto",
          }}
        >
          {/* This is where the transcript goes */}
          {transcript.map((cue) => (
            <div className={"caption"} key={cue.id} ref={cue.ref}>
              {cue.text}
            </div>
          ))}
        </div>

        {/* HTML Content Column */}
        <div
          style={{
            width: "50%", // half of the container width
            overflowY: "auto",
          }}
        >
          {/* highlighted content from fuzzy match */}
          <div
            dangerouslySetInnerHTML={{
              // __html: markupContent,
              __html: markupContentHighlight,
            }}
          />
        </div>
      </div>
      <div>
        {/* Reload button  */}
        <button
          onClick={() => location.reload()}
          style={{ fontSize: "1.5rem", padding: "1rem", margin: "1rem" }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function stripHTML(text) {
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent || div.innerText || "";
}
function normalizeText(text) {
  // Strip HTML tags from text
  // This RE does not work,
  // const stripRE = /<(?:"[^"]*"['"]*'[^']*'['"]*[^'">])+>/g;
  // const strippedHtml = text.replace(stripRE, "");
  const strippedHtml = stripHTML(text);
  // Normalize text: convert to lowercase, remove non-word characters, collapse spaces
  return strippedHtml
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function highlightCueInMarkupContent(cueText, markupContent) {
  // Normalize the cue text and the markup content
  const normalizedCueText = normalizeText(cueText);
  const normalizedMarkupContent = normalizeText(markupContent).slice(0, 100);

  console.log("-----------------");
  console.log("|cue|:   ", normalizedCueText);
  console.log("|markup|:", normalizedMarkupContent);
  // Find the entire cue text in the normalized markup content
  const markupIndexMatch = normalizedMarkupContent.indexOf(normalizedCueText);

  if (markupIndexMatch !== -1) {
    // Highlight the match in the original markup content
    return (
      `<span class="caption current">There is a match somewehere for "${normalizedCueText}"</span>` +
      markupContent
    );
  }

  console.warn(`Cue text not found in markup : ${cueText.slice(0, 20)}...`);
  return markupContent;
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
