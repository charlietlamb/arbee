import type { AppConfig } from "./config.ts";
import type { OddsBuffer } from "./odds-buffer.ts";
import type { IngestBatch } from "./ingest.ts";

export type PollCycleSummary = {
  fetchedAt: string;
  events: number;
  bookmakers: number;
  markets: number;
  outcomes: number;
  historySize: number;
  requestsRemaining: number | null;
  requestsUsed: number | null;
  requestsLast: number | null;
};

export function createCycleSummary(batch: IngestBatch, buffer: OddsBuffer): PollCycleSummary {
  const snapshot = buffer.getSnapshot();

  return {
    fetchedAt: batch.fetchedAt,
    events: snapshot.eventCount,
    bookmakers: snapshot.bookmakerCount,
    markets: snapshot.marketCount,
    outcomes: snapshot.outcomeCount,
    historySize: snapshot.historySize,
    requestsRemaining: batch.quota.requestsRemaining,
    requestsUsed: batch.quota.requestsUsed,
    requestsLast: batch.quota.requestsLast,
  };
}

export function formatCycleSummary(summary: PollCycleSummary, config: AppConfig): string {
  return [
    `[${summary.fetchedAt}]`,
    `sport=${config.ODDS_API_SPORT}`,
    `regions=${config.ODDS_API_REGIONS}`,
    `markets=${config.ODDS_API_MARKETS}`,
    `events=${summary.events}`,
    `bookmakers=${summary.bookmakers}`,
    `markets_total=${summary.markets}`,
    `outcomes=${summary.outcomes}`,
    `history=${summary.historySize}`,
    `requests_remaining=${summary.requestsRemaining ?? "n/a"}`,
    `requests_used=${summary.requestsUsed ?? "n/a"}`,
    `requests_last=${summary.requestsLast ?? "n/a"}`,
  ].join(" ");
}
