import { z } from "zod";

const RequiredString = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string().min(1, "ODDS_API_KEY is required"),
);

const EnvSchema = z.object({
  ODDS_API_KEY: RequiredString,
  ODDS_API_BASE_URL: z.url().default("https://api.the-odds-api.com/v4"),
  ODDS_API_SPORT: z.string().min(1).default("upcoming"),
  ODDS_API_REGIONS: z.string().min(1).default("us"),
  ODDS_API_MARKETS: z.string().min(1).default("h2h"),
  ODDS_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  ODDS_BUFFER_HISTORY_LIMIT: z.coerce.number().int().positive().default(25),
  ODDS_API_ODDS_FORMAT: z.enum(["decimal", "american"]).default("decimal"),
  ODDS_API_DATE_FORMAT: z.enum(["iso", "unix"]).default("iso"),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function loadConfig(env: Record<string, string | undefined> = Bun.env): AppConfig {
  return EnvSchema.parse(env);
}
