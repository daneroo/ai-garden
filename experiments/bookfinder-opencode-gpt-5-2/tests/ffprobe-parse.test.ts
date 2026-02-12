import { describe, expect, it } from "vitest";
import { parseFfprobeJson } from "../src/ffprobe";

describe("parseFfprobeJson", () => {
  it("extracts duration/bitrate/codec/tags", () => {
    const sample = JSON.stringify({
      format: {
        duration: "3661.2",
        bit_rate: "128000",
        tags: {
          title: "The Title",
          artist: "The Artist",
        },
      },
      streams: [
        {
          codec_type: "audio",
          codec_name: "aac",
        },
      ],
    });

    expect(parseFfprobeJson(sample)).toEqual({
      durationSeconds: 3661.2,
      bitrateKbps: 128,
      codec: "aac",
      title: "The Title",
      artist: "The Artist",
    });
  });
});
