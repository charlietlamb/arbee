import { z } from "zod";

import type { OddsApiEvent } from "./odds-api.ts";

export const OutcomePriceSchema = z.object({
  name: z.string(),
  price: z.number(),
  point: z.number().nullable(),
});

export const MarketUpdateSchema = z.object({
  marketKey: z.string(),
  lastUpdate: z.string(),
  outcomes: z.array(OutcomePriceSchema),
});

export const BookmakerUpdateSchema = z.object({
  bookmakerKey: z.string(),
  bookmakerTitle: z.string(),
  lastUpdate: z.string(),
  markets: z.array(MarketUpdateSchema),
});

export const EventStateSchema = z.object({
  eventId: z.string(),
  sportKey: z.string(),
  sportTitle: z.string(),
  commenceTime: z.string(),
  homeTeam: z.string().nullable(),
  awayTeam: z.string().nullable(),
  bookmakers: z.array(BookmakerUpdateSchema),
  sourceFetchedAt: z.string(),
});

export const IngestUpdateSchema = z.object({
  type: z.literal("upsert_event"),
  event: EventStateSchema,
});

export const IngestBatchSchema = z.object({
  fetchedAt: z.string(),
  quota: z.object({
    requestsRemaining: z.number().nullable(),
    requestsUsed: z.number().nullable(),
    requestsLast: z.number().nullable(),
  }),
  updates: z.array(IngestUpdateSchema),
});

export type OutcomePrice = z.infer<typeof OutcomePriceSchema>;
export type MarketUpdate = z.infer<typeof MarketUpdateSchema>;
export type BookmakerUpdate = z.infer<typeof BookmakerUpdateSchema>;
export type EventState = z.infer<typeof EventStateSchema>;
export type IngestUpdate = z.infer<typeof IngestUpdateSchema>;
export type IngestBatch = z.infer<typeof IngestBatchSchema>;

export function normalizeOddsPayload(events: OddsApiEvent[], fetchedAt: string): IngestUpdate[] {
  return events.map((event) =>
    IngestUpdateSchema.parse({
      type: "upsert_event",
      event: normalizeEvent(event, fetchedAt),
    }),
  );
}

function normalizeEvent(event: OddsApiEvent, fetchedAt: string): EventState {
  return EventStateSchema.parse({
    eventId: event.id,
    sportKey: event.sport_key,
    sportTitle: event.sport_title,
    commenceTime: event.commence_time,
    homeTeam: event.home_team ?? null,
    awayTeam: event.away_team ?? null,
    bookmakers: event.bookmakers.map((bookmaker): BookmakerUpdate => ({
      bookmakerKey: bookmaker.key,
      bookmakerTitle: bookmaker.title,
      lastUpdate: bookmaker.last_update,
      markets: bookmaker.markets.map((market): MarketUpdate => ({
        marketKey: market.key,
        lastUpdate: market.last_update,
        outcomes: market.outcomes.map((outcome): OutcomePrice => ({
          name: outcome.name,
          price: outcome.price,
          point: outcome.point ?? null,
        })),
      })),
    })),
    sourceFetchedAt: fetchedAt,
  });
}
