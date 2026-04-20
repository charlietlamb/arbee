import { expect, test } from "bun:test";

import { getOddsApiKey, OddsApiClient } from "./client.ts";

test("getOddsApiKey reads ODDS_API_KEY", () => {
  expect(getOddsApiKey({ ODDS_API_KEY: "test-key" })).toBe("test-key");
});

test("getSports sends the API key and query params", async () => {
  let url: URL | undefined;

  const fetchMock = ((input: string | URL | Request) => {
    url = new URL(input instanceof Request ? input.url : String(input));
    return Promise.resolve(Response.json([]));
  }) as typeof fetch;

  const client = new OddsApiClient({
    env: { ODDS_API_KEY: "secret" },
    fetch: fetchMock,
  });

  await expect(client.getSports({ all: true })).resolves.toEqual([]);
  expect(url?.pathname).toBe("/v4/sports");
  expect(url?.searchParams.get("all")).toBe("true");
  expect(url?.searchParams.get("apiKey")).toBe("secret");
});
