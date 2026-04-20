import { describe, expect, test } from "bun:test";

import { OddsBuffer } from "./odds-buffer.ts";
import { IngestBatchSchema } from "./ingest.ts";

function createBatch(
  fetchedAt: string,
  price: number,
  requestsRemaining = 99,
) {
  return IngestBatchSchema.parse({
    fetchedAt,
    quota: {
      requestsRemaining,
      requestsUsed: 1,
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
          sourceFetchedAt: fetchedAt,
          bookmakers: [
            {
              bookmakerKey: "draftkings",
              bookmakerTitle: "DraftKings",
              lastUpdate: fetchedAt,
              markets: [
                {
                  marketKey: "h2h",
                  lastUpdate: fetchedAt,
                  outcomes: [
                    { name: "Boston Celtics", price, point: null },
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
}

describe("OddsBuffer", () => {
  test("stores latest event state", () => {
    const buffer = new OddsBuffer(2);
    buffer.applyBatch(createBatch("2026-04-20T19:00:10Z", 1.71));

    const event = buffer.getEvent("evt-1");

    expect(event?.bookmakers[0]?.markets[0]?.outcomes[0]?.price).toBe(1.71);
    expect(buffer.getSnapshot().eventCount).toBe(1);
  });

  test("updates latest odds when a later batch arrives", () => {
    const buffer = new OddsBuffer(2);
    buffer.applyBatch(createBatch("2026-04-20T19:00:10Z", 1.71));
    buffer.applyBatch(createBatch("2026-04-20T19:01:10Z", 1.65, 98));

    const event = buffer.getEvent("evt-1");

    expect(event?.sourceFetchedAt).toBe("2026-04-20T19:01:10Z");
    expect(event?.bookmakers[0]?.markets[0]?.outcomes[0]?.price).toBe(1.65);
    expect(buffer.getHistory()).toHaveLength(2);
  });

  test("evicts oldest history entries beyond the configured limit", () => {
    const buffer = new OddsBuffer(2);
    buffer.applyBatch(createBatch("2026-04-20T19:00:10Z", 1.71));
    buffer.applyBatch(createBatch("2026-04-20T19:01:10Z", 1.69));
    buffer.applyBatch(createBatch("2026-04-20T19:02:10Z", 1.67));

    expect(buffer.getHistory()).toHaveLength(2);
    expect(buffer.getHistory()[0]?.fetchedAt).toBe("2026-04-20T19:01:10Z");
  });
});
