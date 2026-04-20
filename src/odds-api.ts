import { z } from "zod";

import type { AppConfig } from "./config.ts";

const OutcomeSchema = z.object({
  name: z.string(),
  price: z.number(),
  point: z.number().nullable().optional(),
});

const MarketSchema = z.object({
  key: z.string(),
  last_update: z.string(),
  outcomes: z.array(OutcomeSchema),
});

const BookmakerSchema = z.object({
  key: z.string(),
  title: z.string(),
  last_update: z.string(),
  markets: z.array(MarketSchema),
});

const EventSchema = z.object({
  id: z.string(),
  sport_key: z.string(),
  sport_title: z.string(),
  commence_time: z.string(),
  home_team: z.string().nullable().optional(),
  away_team: z.string().nullable().optional(),
  bookmakers: z.array(BookmakerSchema).default([]),
});

export const SportsResponseSchema = z.array(
  z.object({
    key: z.string(),
    group: z.string(),
    title: z.string(),
    description: z.string(),
    active: z.boolean(),
    has_outrights: z.boolean(),
  }),
);

export const OddsApiOddsResponseSchema = z.array(EventSchema);

export type OddsApiSport = z.infer<typeof SportsResponseSchema>[number];
export type OddsApiEvent = z.infer<typeof OddsApiOddsResponseSchema>[number];

export type OddsApiQuota = {
  requestsRemaining: number | null;
  requestsUsed: number | null;
  requestsLast: number | null;
};

export type FetchOddsResult = {
  events: OddsApiEvent[];
  quota: OddsApiQuota;
  fetchedAt: string;
};

export class OddsApiClient {
  constructor(private readonly config: AppConfig) {}

  async fetchSports(): Promise<OddsApiSport[]> {
    const response = await this.fetchFromApi("/sports");
    const payload = await response.json();
    return SportsResponseSchema.parse(payload);
  }

  async fetchOdds(): Promise<FetchOddsResult> {
    const params = new URLSearchParams({
      apiKey: this.config.ODDS_API_KEY,
      regions: this.config.ODDS_API_REGIONS,
      markets: this.config.ODDS_API_MARKETS,
      oddsFormat: this.config.ODDS_API_ODDS_FORMAT,
      dateFormat: this.config.ODDS_API_DATE_FORMAT,
    });

    const response = await this.fetchFromApi(
      `/sports/${this.config.ODDS_API_SPORT}/odds?${params.toString()}`,
    );
    const payload = await response.json();

    return {
      events: OddsApiOddsResponseSchema.parse(payload),
      quota: parseQuotaHeaders(response.headers),
      fetchedAt: new Date().toISOString(),
    };
  }

  private async fetchFromApi(path: string): Promise<Response> {
    const response = await fetch(`${this.config.ODDS_API_BASE_URL}${path}`);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`The Odds API request failed (${response.status}): ${body}`);
    }

    return response;
  }
}

function parseQuotaHeaders(headers: Headers): OddsApiQuota {
  return {
    requestsRemaining: parseHeaderNumber(headers.get("x-requests-remaining")),
    requestsUsed: parseHeaderNumber(headers.get("x-requests-used")),
    requestsLast: parseHeaderNumber(headers.get("x-requests-last")),
  };
}

function parseHeaderNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
