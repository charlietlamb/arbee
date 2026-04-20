import { IngestBatchSchema, type EventState, type IngestBatch } from "./ingest.ts";

export type BufferSnapshot = {
  eventCount: number;
  bookmakerCount: number;
  marketCount: number;
  outcomeCount: number;
  lastFetchedAt: string | null;
  historySize: number;
};

export class OddsBuffer {
  private readonly latestEvents = new Map<string, EventState>();
  private readonly history: IngestBatch[] = [];
  private lastFetchedAt: string | null = null;

  constructor(private readonly historyLimit: number) {}

  applyBatch(batch: IngestBatch): void {
    const parsedBatch = IngestBatchSchema.parse(batch);

    for (const update of parsedBatch.updates) {
      this.latestEvents.set(update.event.eventId, update.event);
    }

    this.lastFetchedAt = parsedBatch.fetchedAt;
    this.history.push(parsedBatch);

    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }
  }

  getEvent(eventId: string): EventState | undefined {
    return this.latestEvents.get(eventId);
  }

  getHistory(): readonly IngestBatch[] {
    return this.history;
  }

  getLatestEvents(): readonly EventState[] {
    return [...this.latestEvents.values()];
  }

  getSnapshot(): BufferSnapshot {
    const events = this.getLatestEvents();
    const bookmakerCount = events.reduce((total, event) => total + event.bookmakers.length, 0);
    const marketCount = events.reduce(
      (total, event) =>
        total +
        event.bookmakers.reduce(
          (bookmakerTotal: number, bookmaker) => bookmakerTotal + bookmaker.markets.length,
          0,
        ),
      0,
    );
    const outcomeCount = events.reduce(
      (total, event) =>
        total +
        event.bookmakers.reduce(
          (bookmakerTotal: number, bookmaker) =>
            bookmakerTotal +
            bookmaker.markets.reduce((marketTotal, market) => marketTotal + market.outcomes.length, 0),
          0,
        ),
      0,
    );

    return {
      eventCount: events.length,
      bookmakerCount,
      marketCount,
      outcomeCount,
      lastFetchedAt: this.lastFetchedAt,
      historySize: this.history.length,
    };
  }
}
