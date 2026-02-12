type TableRow = {
  file: string;
  duration: string;
  bitrate: string;
  codec: string;
  title: string;
};

export function truncateMiddle(text: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (text.length <= maxWidth) return text;
  if (maxWidth <= 3) return ".".repeat(maxWidth);

  const keep = maxWidth - 3;
  const left = Math.ceil(keep / 2);
  const right = Math.floor(keep / 2);
  return `${text.slice(0, left)}...${text.slice(text.length - right)}`;
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + " ".repeat(width - text.length);
}

export function renderTable(rows: TableRow[], opts?: { maxWidth?: number }): string {
  const maxWidth = opts?.maxWidth ?? process.stdout.columns ?? 120;

  const headers: TableRow = {
    file: "File",
    duration: "Duration",
    bitrate: "Bitrate",
    codec: "Codec",
    title: "Title",
  };

  const durationWidth = Math.max(headers.duration.length, ...rows.map((r) => r.duration.length));
  const bitrateWidth = Math.max(headers.bitrate.length, ...rows.map((r) => r.bitrate.length));
  const codecWidth = Math.max(headers.codec.length, ...rows.map((r) => r.codec.length));
  const titleWidth = Math.max(headers.title.length, ...rows.map((r) => r.title.length));

  const separators = 4;
  const fixed = durationWidth + bitrateWidth + codecWidth + titleWidth + separators * 3;
  const fileWidth = Math.max(10, Math.min(80, maxWidth - fixed));

  const lines: string[] = [];
  lines.push(
    [
      padRight(headers.file, fileWidth),
      padRight(headers.duration, durationWidth),
      padRight(headers.bitrate, bitrateWidth),
      padRight(headers.codec, codecWidth),
      padRight(headers.title, titleWidth),
    ].join(" | "),
  );
  lines.push(
    [
      "-".repeat(fileWidth),
      "-".repeat(durationWidth),
      "-".repeat(bitrateWidth),
      "-".repeat(codecWidth),
      "-".repeat(titleWidth),
    ].join("-+-"),
  );

  for (const r of rows) {
    lines.push(
      [
        padRight(truncateMiddle(r.file, fileWidth), fileWidth),
        padRight(r.duration, durationWidth),
        padRight(r.bitrate, bitrateWidth),
        padRight(r.codec, codecWidth),
        padRight(r.title, titleWidth),
      ].join(" | "),
    );
  }

  return lines.join("\n");
}
