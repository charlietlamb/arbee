import { z } from "zod/v4";
import {
  apiKeyEnvSchema,
  type EventMarketsRequest,
  type EventOddsRequest,
  type EventsRequest,
  eventMarketsRequestSchema,
  eventMarketsSchema,
  eventOddsRequestSchema,
  eventSchema,
  eventsRequestSchema,
  type HistoricalEventOddsRequest,
  type HistoricalEventsRequest,
  type HistoricalOddsRequest,
  historicalEventOddsRequestSchema,
  historicalEventsRequestSchema,
  historicalOddsRequestSchema,
  historicalResponseSchema,
  type OddsRequest,
  oddsEventSchema,
  oddsRequestSchema,
  type ParticipantsRequest,
  participantSchema,
  participantsRequestSchema,
  type ScoresRequest,
  type SportsRequest,
  scoresRequestSchema,
  sportSchema,
  sportsRequestSchema,
} from "./schemas.ts";

const baseUrl = "https://api.the-odds-api.com";
type Query = Record<string, string | number | boolean | string[] | undefined>;

const toQuery = (query: Query) =>
  Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) =>
      value === undefined
        ? []
        : [[key, Array.isArray(value) ? value.join(",") : String(value)]]
    )
  ) as Record<string, string>;

export const getOddsApiKey = (
  env: Record<string, string | undefined> = process.env
) => apiKeyEnvSchema.parse(env).ODDS_API_KEY;

export class OddsApiClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly fetch: typeof fetch;

  constructor(
    options: {
      env?: Record<string, string | undefined>;
      baseUrl?: string;
      fetch?: typeof fetch;
    } = {}
  ) {
    this.apiKey = getOddsApiKey(options.env);
    this.baseUrl = options.baseUrl ?? baseUrl;
    this.fetch = options.fetch ?? fetch;
  }

  getSports(input: SportsRequest = {}) {
    return this.get(
      "/v4/sports",
      sportsRequestSchema.parse(input),
      z.array(sportSchema)
    );
  }

  getOdds(input: OddsRequest) {
    const { sport, ...query } = oddsRequestSchema.parse(input);
    return this.get(
      `/v4/sports/${encodeURIComponent(sport)}/odds`,
      query,
      z.array(oddsEventSchema)
    );
  }

  getScores(input: ScoresRequest) {
    const { sport, ...query } = scoresRequestSchema.parse(input);
    return this.get(
      `/v4/sports/${encodeURIComponent(sport)}/scores`,
      query,
      z.array(eventSchema)
    );
  }

  getEvents(input: EventsRequest) {
    const { sport, ...query } = eventsRequestSchema.parse(input);
    return this.get(
      `/v4/sports/${encodeURIComponent(sport)}/events`,
      query,
      z.array(eventSchema)
    );
  }

  getEventOdds(input: EventOddsRequest) {
    const { sport, eventId, ...query } = eventOddsRequestSchema.parse(input);
    return this.get(
      `/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds`,
      query,
      oddsEventSchema
    );
  }

  getEventMarkets(input: EventMarketsRequest) {
    const { sport, eventId, ...query } = eventMarketsRequestSchema.parse(input);
    return this.get(
      `/v4/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/markets`,
      query,
      eventMarketsSchema
    );
  }

  getParticipants(input: ParticipantsRequest) {
    const { sport } = participantsRequestSchema.parse(input);
    return this.get(
      `/v4/sports/${encodeURIComponent(sport)}/participants`,
      {},
      z.array(participantSchema)
    );
  }

  getHistoricalOdds(input: HistoricalOddsRequest) {
    const { sport, ...query } = historicalOddsRequestSchema.parse(input);
    return this.get(
      `/v4/historical/sports/${encodeURIComponent(sport)}/odds`,
      query,
      historicalResponseSchema(z.array(oddsEventSchema))
    );
  }

  getHistoricalEvents(input: HistoricalEventsRequest) {
    const { sport, ...query } = historicalEventsRequestSchema.parse(input);
    return this.get(
      `/v4/historical/sports/${encodeURIComponent(sport)}/events`,
      query,
      historicalResponseSchema(z.array(eventSchema))
    );
  }

  getHistoricalEventOdds(input: HistoricalEventOddsRequest) {
    const { sport, eventId, ...query } =
      historicalEventOddsRequestSchema.parse(input);
    return this.get(
      `/v4/historical/sports/${encodeURIComponent(sport)}/events/${encodeURIComponent(eventId)}/odds`,
      query,
      historicalResponseSchema(oddsEventSchema)
    );
  }

  private async get<T>(path: string, query: Query, schema: z.ZodType<T>) {
    const url = new URL(path, this.baseUrl);
    url.search = new URLSearchParams(
      toQuery({ apiKey: this.apiKey, ...query })
    ).toString();
    const response = await this.fetch(url);

    if (!response.ok) {
      throw new Error(
        `The Odds API request failed (${response.status} ${response.statusText}): ${await response.text()}`
      );
    }

    return schema.parse(await response.json());
  }
}
