import { formatCycleSummary, createCycleSummary } from "./cli.ts";
import { loadConfig } from "./config.ts";
import { OddsApiClient } from "./odds-api.ts";
import { OddsBuffer } from "./odds-buffer.ts";
import { PollingOddsSource } from "./odds-source.ts";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApp() {
  const config = loadConfig();
  const client = new OddsApiClient(config);
  const source = new PollingOddsSource(client);
  const buffer = new OddsBuffer(config.ODDS_BUFFER_HISTORY_LIMIT);

  let running = true;

  const stop = () => {
    running = false;
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  return {
    async start(): Promise<void> {
      const sports = await client.fetchSports();
      const hasRequestedSport =
        config.ODDS_API_SPORT === "upcoming" ||
        sports.some((sport) => sport.key === config.ODDS_API_SPORT);

      if (!hasRequestedSport) {
        throw new Error(`Configured sport "${config.ODDS_API_SPORT}" is not available from /sports`);
      }

      while (running) {
        const batch = await source.pollOnce();
        buffer.applyBatch(batch);

        const summary = createCycleSummary(batch, buffer);
        console.log(formatCycleSummary(summary, config));

        if (!running) {
          break;
        }

        await sleep(config.ODDS_POLL_INTERVAL_MS);
      }
    },
  };
}
