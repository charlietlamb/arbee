import { describe, expect, test } from "bun:test";

import { loadConfig } from "./config.ts";

describe("loadConfig", () => {
  test("parses required env and applies defaults", () => {
    const config = loadConfig({
      ODDS_API_KEY: "test-key",
    });

    expect(config.ODDS_API_BASE_URL).toBe("https://api.the-odds-api.com/v4");
    expect(config.ODDS_API_SPORT).toBe("upcoming");
    expect(config.ODDS_POLL_INTERVAL_MS).toBe(60_000);
    expect(config.ODDS_BUFFER_HISTORY_LIMIT).toBe(25);
  });

  test("throws when api key is missing", () => {
    expect(() => loadConfig({})).toThrow("ODDS_API_KEY is required");
  });
});
