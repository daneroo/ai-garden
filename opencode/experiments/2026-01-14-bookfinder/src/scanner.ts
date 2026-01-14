import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface AudiobookFile {
	path: string;
	basename: string;
	size: number;
	mtime: Date;
}

const EXTENSIONS = [".m4b", ".mp3", ".m4a"];

export async function* scanDirectory(
	dir: string,
): AsyncGenerator<AudiobookFile> {
	try {
		const files = await readdir(dir);
		for (const file of files) {
			const fullPath = join(dir, file);
			try {
				const stats = await lstat(fullPath);
				if (stats.isSymbolicLink()) {
					console.warn(`Warning: Skipping symlink ${fullPath}`);
					continue;
				}
				if (stats.isDirectory()) {
					yield* scanDirectory(fullPath);
				} else if (EXTENSIONS.some((ext) => file.endsWith(ext))) {
					yield {
						path: fullPath,
						basename: file,
						size: stats.size,
						mtime: stats.mtime,
					};
				}
			} catch (err) {
				if (err instanceof Error) {
					console.warn(`Warning: Cannot access ${fullPath}: ${err.message}`);
				}
			}
		}
	} catch (err) {
		if (err instanceof Error) {
			console.warn(`Warning: Cannot access directory ${dir}: ${err.message}`);
		}
	}
}
