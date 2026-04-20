import type { z } from "zod/v4";
import type {
  bookmakerSchema,
  eventMarketsSchema,
  eventSchema,
  historicalResponseSchema,
  marketSchema,
  oddsEventSchema,
  outcomeSchema,
  participantSchema,
  scoreSchema,
  sportSchema,
} from "./schemas.ts";

export type Sport = z.infer<typeof sportSchema>;
export type Score = z.infer<typeof scoreSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type Market = z.infer<typeof marketSchema>;
export type Bookmaker = z.infer<typeof bookmakerSchema>;
export type OddsEvent = z.infer<typeof oddsEventSchema>;
export type EventMarkets = z.infer<typeof eventMarketsSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type HistoricalResponse<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof historicalResponseSchema<T>>
>;
