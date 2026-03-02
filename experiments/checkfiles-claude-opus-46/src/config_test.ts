import { assertEquals } from "@std/assert";
import { resolveConfig } from "./config.ts";

const DATA_DIR = new URL("../data/config-test", import.meta.url).pathname;

function setup() {
  Deno.mkdirSync(DATA_DIR, { recursive: true });
}

function teardown() {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
}

Deno.test("config: resolves rootpath from --rootpath flag", () => {
  setup();
  try {
    // Temporarily override Deno.args
    const origArgs = Deno.args;
    Object.defineProperty(Deno, "args", {
      value: ["--rootpath", DATA_DIR],
      configurable: true,
    });
    try {
      const config = resolveConfig();
      assertEquals(config.rootPath, DATA_DIR);
    } finally {
      Object.defineProperty(Deno, "args", {
        value: origArgs,
        configurable: true,
      });
    }
  } finally {
    teardown();
  }
});

Deno.test("config: resolves rootpath from -r alias", () => {
  setup();
  try {
    const origArgs = Deno.args;
    Object.defineProperty(Deno, "args", {
      value: ["-r", DATA_DIR],
      configurable: true,
    });
    try {
      const config = resolveConfig();
      assertEquals(config.rootPath, DATA_DIR);
    } finally {
      Object.defineProperty(Deno, "args", {
        value: origArgs,
        configurable: true,
      });
    }
  } finally {
    teardown();
  }
});

Deno.test("config: flag takes precedence over env", () => {
  setup();
  try {
    const origArgs = Deno.args;
    Deno.env.set("ROOT_PATH", "/some/other/path");
    Object.defineProperty(Deno, "args", {
      value: ["--rootpath", DATA_DIR],
      configurable: true,
    });
    try {
      const config = resolveConfig();
      assertEquals(config.rootPath, DATA_DIR);
    } finally {
      Object.defineProperty(Deno, "args", {
        value: origArgs,
        configurable: true,
      });
      Deno.env.delete("ROOT_PATH");
    }
  } finally {
    teardown();
  }
});

Deno.test("config: resolves rootpath from ROOT_PATH env", () => {
  setup();
  try {
    const origArgs = Deno.args;
    Object.defineProperty(Deno, "args", {
      value: [],
      configurable: true,
    });
    Deno.env.set("ROOT_PATH", DATA_DIR);
    try {
      const config = resolveConfig();
      assertEquals(config.rootPath, DATA_DIR);
    } finally {
      Object.defineProperty(Deno, "args", {
        value: origArgs,
        configurable: true,
      });
      Deno.env.delete("ROOT_PATH");
    }
  } finally {
    teardown();
  }
});
