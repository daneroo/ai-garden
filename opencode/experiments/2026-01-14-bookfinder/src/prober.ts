import { spawn } from "bun";

export interface Metadata {
	duration: number;
	bit_rate: number;
	codec_name: string;
	title?: string;
	artist?: string;
	album?: string;
}

export async function probeFile(path: string): Promise<Metadata> {
	const proc = spawn([
		"ffprobe",
		"-v",
		"error",
		"-show_format",
		"-show_streams",
		"-of",
		"json",
		path,
	]);

	const output = await new Response(proc.stdout).text();
	const status = await proc.exited;

	if (status !== 0) {
		const error = await new Response(proc.stderr).text();
		throw new Error(
			`ffprobe failed for ${path} (exit code ${status}): ${error}`,
		);
	}

	const data = JSON.parse(output);
	const format = data.format || {};
	const streams = data.streams || [];
	const audioStream =
		streams.find((s: { codec_type: string }) => s.codec_type === "audio") || {};

	return {
		duration: Number.parseFloat(format.duration || "0"),
		bit_rate: Number.parseInt(format.bit_rate || "0", 10),
		codec_name: audioStream.codec_name || "unknown",
		title: format.tags?.title,
		artist: format.tags?.artist || format.tags?.album_artist,
		album: format.tags?.album,
	};
}
