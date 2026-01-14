#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { probeFile } from "./prober";
import { scanDirectory } from "./scanner";
import { formatDate, formatDuration, formatSize } from "./utils";

const argv = yargs(hideBin(process.argv))
	.option("rootpath", {
		alias: "r",
		type: "string",
		default: process.env.ROOTPATH || "/Volumes/Space/Reading/audiobooks/",
		describe: "Root directory to scan",
	})
	.option("json", {
		type: "boolean",
		default: false,
		describe: "Output in JSON format",
	})
	.help("h")
	.alias("h", "help")
	.parseSync();

async function parallelMap<T, R>(
	items: T[],
	limit: number,
	fn: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = [];
	const running = new Set<Promise<void>>();
	for (const item of items) {
		const promise = fn(item).then((res) => {
			results.push(res);
			running.delete(promise);
		});
		running.add(promise);
		if (running.size >= limit) {
			await Promise.race(running);
		}
	}
	await Promise.all(running);
	return results;
}

async function main() {
	const files = [];
	for await (const file of scanDirectory(argv.rootpath)) {
		files.push(file);
	}

	const probedFiles = await parallelMap(files, 8, async (file) => {
		const metadata = await probeFile(file.path);
		return {
			...file,
			metadata,
		};
	});

	probedFiles.sort((a, b) => a.basename.localeCompare(b.basename));

	for (const file of probedFiles) {
		if (argv.json) {
			console.log(
				JSON.stringify({
					basename: file.basename,
					size: file.size, // Bytes in JSON as requested
					mtime: formatDate(file.mtime),
					...file.metadata,
				}),
			);
		} else {
			const { duration, author, title } = file.metadata;
			console.log(
				`${file.basename} | ${formatSize(file.size)} | ${formatDuration(duration)} | ${author || "Unknown"} | ${title || "Unknown"}`,
			);
		}
	}
}

main().catch(console.error);
