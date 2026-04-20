import { describe, expect, test } from "bun:test";

import { OddsApiOddsResponseSchema } from "./odds-api.ts";
import { normalizeOddsPayload } from "./ingest.ts";

const oddsFixture = [
  {
    id: "evt-1",
    sport_key: "basketball_nba",
    sport_title: "NBA",
    commence_time: "2026-04-20T19:00:00Z",
    home_team: "Boston Celtics",
    away_team: "Miami Heat",
    bookmakers: [
      {
        key: "draftkings",
        title: "DraftKings",
        last_update: "2026-04-20T18:59:00Z",
        markets: [
          {
            key: "h2h",
            last_update: "2026-04-20T18:59:00Z",
            outcomes: [
              { name: "Boston Celtics", price: 1.71 },
              { name: "Miami Heat", price: 2.2 },
            ],
          },
        ],
      },
    ],
  },
];

describe("Odds API parsing", () => {
  test("accepts valid odds payloads", () => {
    const parsed = OddsApiOddsResponseSchema.parse(oddsFixture);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe("evt-1");
  });

  test("normalizes provider payload into typed ingest events", () => {
    const parsed = OddsApiOddsResponseSchema.parse(oddsFixture);
    const updates = normalizeOddsPayload(parsed, "2026-04-20T19:00:10Z");

    expect(updates).toHaveLength(1);
    expect(updates[0]?.event.eventId).toBe("evt-1");
    expect(updates[0]?.event.bookmakers[0]?.markets[0]?.outcomes[1]?.price).toBe(2.2);
  });
});
