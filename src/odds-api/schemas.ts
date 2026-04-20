import { z } from "zod/v4";

const nonEmpty = z.string().min(1);
const isoDateTime = z.iso.datetime({ offset: true });
const eventId = z.string().length(32);
const listOf = (item: z.ZodType<string>) =>
  z
    .array(item)
    .min(1)
    .refine((values) => new Set(values).size === values.length, {
      message: "Array values must be unique",
    });

const optionalDate = {
  dateFormat: z.enum(["iso", "unix"]).optional(),
};

const optionalOdds = {
  ...optionalDate,
  oddsFormat: z.enum(["decimal", "american"]).optional(),
};

const optionalBooks = {
  regions: listOf(nonEmpty).optional(),
  bookmakers: listOf(nonEmpty).optional(),
};

const optionalFilters = {
  eventIds: listOf(eventId).optional(),
  commenceTimeFrom: isoDateTime.optional(),
  commenceTimeTo: isoDateTime.optional(),
};

const optionalFlags = {
  includeLinks: z.boolean().optional(),
  includeSids: z.boolean().optional(),
  includeBetLimits: z.boolean().optional(),
  includeRotationNumbers: z.boolean().optional(),
};

const withBooks = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict()
    .superRefine((value, ctx) => {
      const { regions, bookmakers } = value as {
        regions?: string[];
        bookmakers?: string[];
      };

      if (!(regions || bookmakers)) {
        ctx.addIssue({
          code: "custom",
          path: ["regions"],
          message: "regions or bookmakers is required",
        });
      }
    });

export const apiKeyEnvSchema = z
  .object({
    ODDS_API_KEY: z.string().min(1),
  })
  .strict();

export const sportsRequestSchema = z
  .object({
    all: z.boolean().optional(),
  })
  .strict();

export const oddsRequestSchema = withBooks({
  sport: nonEmpty,
  ...optionalOdds,
  ...optionalBooks,
  ...optionalFilters,
  ...optionalFlags,
  markets: listOf(nonEmpty).optional(),
});

export const scoresRequestSchema = z
  .object({
    sport: nonEmpty,
    ...optionalDate,
    daysFrom: z.number().int().min(1).max(3).optional(),
  })
  .strict();

export const eventsRequestSchema = z
  .object({
    sport: nonEmpty,
    ...optionalDate,
    ...optionalFilters,
  })
  .strict();

export const eventOddsRequestSchema = withBooks({
  sport: nonEmpty,
  eventId,
  ...optionalOdds,
  ...optionalBooks,
  ...optionalFlags,
  markets: listOf(nonEmpty).optional(),
  includeMultipliers: z.boolean().optional(),
});

export const eventMarketsRequestSchema = withBooks({
  sport: nonEmpty,
  eventId,
  ...optionalDate,
  ...optionalBooks,
});

export const participantsRequestSchema = z
  .object({
    sport: nonEmpty,
  })
  .strict();

export const historicalOddsRequestSchema = withBooks({
  sport: nonEmpty,
  date: isoDateTime,
  ...optionalOdds,
  ...optionalBooks,
  ...optionalFilters,
  ...optionalFlags,
  markets: listOf(nonEmpty).optional(),
});

export const historicalEventsRequestSchema = z
  .object({
    sport: nonEmpty,
    date: isoDateTime,
    ...optionalDate,
    ...optionalFilters,
  })
  .strict();

export const historicalEventOddsRequestSchema = withBooks({
  sport: nonEmpty,
  eventId,
  date: isoDateTime,
  ...optionalOdds,
  ...optionalBooks,
  ...optionalFlags,
  markets: listOf(nonEmpty).optional(),
  includeMultipliers: z.boolean().optional(),
});

const timestampSchema = z.union([z.string(), z.number()]);

export const sportSchema = z
  .object({
    key: z.string(),
    group: z.string(),
    title: z.string(),
    description: z.string(),
    active: z.boolean(),
    has_outrights: z.boolean(),
  })
  .strict();

export const scoreSchema = z
  .object({
    name: z.string(),
    score: z.string(),
  })
  .strict();

export const eventSchema = z
  .object({
    id: z.string(),
    sport_key: z.string(),
    sport_title: z.string(),
    commence_time: timestampSchema,
    home_team: z.string(),
    away_team: z.string(),
    scores: z.array(scoreSchema).optional(),
    completed: z.boolean().optional(),
    last_update: timestampSchema.optional(),
  })
  .strict();

export const outcomeSchema = z
  .object({
    name: z.string(),
    price: z.number(),
    point: z.number().optional(),
    description: z.string().optional(),
    sid: z.string().optional(),
    link: z.string().optional(),
    deep_link: z.string().optional(),
    bet_limit: z.number().optional(),
  })
  .strict();

export const marketSchema = z
  .object({
    key: z.string(),
    last_update: timestampSchema.optional(),
    outcomes: z.array(outcomeSchema).optional(),
  })
  .strict();

export const bookmakerSchema = z
  .object({
    key: z.string(),
    title: z.string(),
    last_update: timestampSchema.optional(),
    markets: z.array(marketSchema),
  })
  .strict();

export const oddsEventSchema = eventSchema
  .extend({
    bookmakers: z.array(bookmakerSchema),
  })
  .strict();

export const eventMarketsSchema = eventSchema
  .extend({
    bookmakers: z.array(
      z
        .object({
          key: z.string(),
          title: z.string(),
          markets: z.array(
            z
              .object({
                key: z.string(),
                last_update: timestampSchema,
              })
              .strict()
          ),
        })
        .strict()
    ),
  })
  .strict();

export const participantSchema = z
  .object({
    id: z.string(),
    full_name: z.string(),
  })
  .strict();

export const historicalResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z
    .object({
      timestamp: z.string(),
      previous_timestamp: z.string(),
      next_timestamp: z.string(),
      data,
    })
    .strict();

export type SportsRequest = z.infer<typeof sportsRequestSchema>;
export type OddsRequest = z.infer<typeof oddsRequestSchema>;
export type ScoresRequest = z.infer<typeof scoresRequestSchema>;
export type EventsRequest = z.infer<typeof eventsRequestSchema>;
export type EventOddsRequest = z.infer<typeof eventOddsRequestSchema>;
export type EventMarketsRequest = z.infer<typeof eventMarketsRequestSchema>;
export type ParticipantsRequest = z.infer<typeof participantsRequestSchema>;
export type HistoricalOddsRequest = z.infer<typeof historicalOddsRequestSchema>;
export type HistoricalEventsRequest = z.infer<
  typeof historicalEventsRequestSchema
>;
export type HistoricalEventOddsRequest = z.infer<
  typeof historicalEventOddsRequestSchema
>;
