#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { scanDirectory } from "./scanner";
import { formatDate, formatSize } from "./utils";

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

async function main() {
	for await (const file of scanDirectory(argv.rootpath)) {
		if (argv.json) {
			console.log(
				JSON.stringify({
					basename: file.basename,
					size: formatSize(file.size),
					mtime: formatDate(file.mtime),
				}),
			);
		} else {
			console.log(
				`File: ${file.basename} | Size: ${formatSize(file.size)} | Date: ${formatDate(file.mtime)}`,
			);
		}
	}
}

main().catch(console.error);
