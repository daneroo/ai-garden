import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { probeFile } from "../src/prober";
import { scanDirectory } from "../src/scanner";

const FIXTURE_DIR = join(process.cwd(), "tests/fixtures");

describe("Scanner & Prober", () => {
	test("finds and probes Robert Frost fixture", async () => {
		const results = [];
		for await (const file of scanDirectory(FIXTURE_DIR)) {
			results.push(file);
		}

		const frost = results.find(
			(f) => f.basename === "Robert Frost - The Road Not Taken.m4b",
		);
		expect(frost).toBeDefined();

		if (frost) {
			const metadata = await probeFile(frost.path);
			expect(metadata.duration).toBeCloseTo(76.19, 1);
			expect(metadata.artist).toBe("Robert Frost");
			expect(metadata.title).toBe("The Road not Taken");
			expect(metadata.codec_name).toBe("aac");
		}
	});

	test("jfk.m4b size is correct", async () => {
		const results = [];
		for await (const file of scanDirectory(FIXTURE_DIR)) {
			results.push(file);
		}

		const jfk = results.find((f) => f.basename === "jfk.m4b");
		expect(jfk).toBeDefined();
		if (jfk) {
			expect(jfk.size).toBeGreaterThan(90000); // 94.34 KB
		}
	});
});
