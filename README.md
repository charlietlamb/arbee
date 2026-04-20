# arbee

To install dependencies:

```bash
bun install
```

Set local env:

```bash
cp .env.example .env
```

Then run the live ingest CLI:

```bash
bun run start
```

The current slice polls The Odds API, validates provider payloads with Zod, normalizes them into a typed ingest stream, and stores latest state plus bounded history in memory for testing.
