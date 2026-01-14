import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { scanDirectory } from "../src/scanner";

const FIXTURE_DIR = join(process.cwd(), "tests/fixtures");

describe("Scanner", () => {
	test("finds jfk.m4b fixture", async () => {
		const results = [];
		for await (const file of scanDirectory(FIXTURE_DIR)) {
			results.push(file);
		}

		const jfk = results.find((f) => f.basename === "jfk.m4b");
		expect(jfk).toBeDefined();
		if (jfk) {
			expect(jfk.size).toBeGreaterThan(0);
			expect(jfk.path).toContain("jfk.m4b");
		}
	});
});
