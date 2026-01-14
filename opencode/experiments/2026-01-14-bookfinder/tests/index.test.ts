import { describe, expect, test } from "bun:test";
import { spawn } from "bun";

describe("CLI", () => {
	test("prints greeting with default name", async () => {
		const proc = spawn(["bun", "run", "src/index.ts"]);
		const text = await new Response(proc.stdout).text();
		expect(text).toContain("Hello World!");
		await proc.exited;
	});

	test("prints greeting with custom name", async () => {
		const proc = spawn(["bun", "run", "src/index.ts", "--name", "Tester"]);
		const text = await new Response(proc.stdout).text();
		expect(text).toContain("Hello Tester!");
		await proc.exited;
	});
});
