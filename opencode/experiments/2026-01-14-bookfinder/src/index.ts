#!/usr/bin/env bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
	.option("name", {
		alias: "n",
		type: "string",
		description: "The name to greet",
		default: "World",
	})
	.parseSync();

console.log(`Hello ${argv.name}!`);
