import type { OddsApiClient } from "./odds-api.ts";
import { IngestBatchSchema, normalizeOddsPayload, type IngestBatch } from "./ingest.ts";

export type OddsProviderSource = {
  pollOnce(): Promise<IngestBatch>;
};

export class PollingOddsSource implements OddsProviderSource {
  constructor(private readonly client: OddsApiClient) {}

  async pollOnce(): Promise<IngestBatch> {
    const result = await this.client.fetchOdds();

    return IngestBatchSchema.parse({
      fetchedAt: result.fetchedAt,
      quota: result.quota,
      updates: normalizeOddsPayload(result.events, result.fetchedAt),
    });
  }
}
