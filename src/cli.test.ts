import { describe, expect, test } from "bun:test";

import { createCycleSummary, formatCycleSummary } from "./cli.ts";
import { loadConfig } from "./config.ts";
import { OddsBuffer } from "./odds-buffer.ts";
import { IngestBatchSchema } from "./ingest.ts";

describe("CLI summary", () => {
  test("formats poll summary from buffer state and quota headers", () => {
    const config = loadConfig({
      ODDS_API_KEY: "test-key",
      ODDS_API_SPORT: "upcoming",
      ODDS_API_REGIONS: "us",
      ODDS_API_MARKETS: "h2h",
    });
    const buffer = new OddsBuffer(5);
    const batch = IngestBatchSchema.parse({
      fetchedAt: "2026-04-20T19:00:10Z",
      quota: {
        requestsRemaining: 98,
        requestsUsed: 2,
        requestsLast: 1,
      },
      updates: [
        {
          type: "upsert_event",
          event: {
            eventId: "evt-1",
            sportKey: "basketball_nba",
            sportTitle: "NBA",
            commenceTime: "2026-04-20T19:00:00Z",
            homeTeam: "Boston Celtics",
            awayTeam: "Miami Heat",
            sourceFetchedAt: "2026-04-20T19:00:10Z",
            bookmakers: [
              {
                bookmakerKey: "draftkings",
                bookmakerTitle: "DraftKings",
                lastUpdate: "2026-04-20T19:00:10Z",
                markets: [
                  {
                    marketKey: "h2h",
                    lastUpdate: "2026-04-20T19:00:10Z",
                    outcomes: [
                      { name: "Boston Celtics", price: 1.71, point: null },
                      { name: "Miami Heat", price: 2.2, point: null },
                    ],
                  },
                ],
              },
            ],
          },
        },
      ],
    });

    buffer.applyBatch(batch);

    const summary = createCycleSummary(batch, buffer);
    const formatted = formatCycleSummary(summary, config);

    expect(summary.events).toBe(1);
    expect(summary.bookmakers).toBe(1);
    expect(formatted).toContain("requests_remaining=98");
    expect(formatted).toContain("events=1");
  });
});
