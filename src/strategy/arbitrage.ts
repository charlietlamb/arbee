import type { OddsEvent } from "../odds-api/types.ts";

export type ArbSelection = {
  outcomeName: string;
  price: number;
  bookmakerKey: string;
  bookmakerTitle: string;
};

export type ArbCandidate = {
  eventId: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  marketKey: "h2h";
  selections: ArbSelection[];
  impliedProbability: number;
  edge: number;
};

const marketKey = "h2h";

export const findArbitrageCandidates = (
  events: OddsEvent[]
): ArbCandidate[] =>
  events.flatMap((event) => {
    const bestByOutcome = new Map<string, ArbSelection>();

    for (const bookmaker of event.bookmakers) {
      for (const market of bookmaker.markets) {
        if (market.key !== marketKey || !market.outcomes) {
          continue;
        }

        for (const outcome of market.outcomes) {
          if (outcome.price <= 0) {
            continue;
          }

          const current = bestByOutcome.get(outcome.name);

          if (!current || outcome.price > current.price) {
            bestByOutcome.set(outcome.name, {
              outcomeName: outcome.name,
              price: outcome.price,
              bookmakerKey: bookmaker.key,
              bookmakerTitle: bookmaker.title,
            });
          }
        }
      }
    }

    const selections = [...bestByOutcome.values()].sort((a, b) =>
      a.outcomeName.localeCompare(b.outcomeName)
    );

    if (selections.length < 2) {
      return [];
    }

    const impliedProbability = selections.reduce(
      (total, selection) => total + 1 / selection.price,
      0
    );

    if (impliedProbability >= 1) {
      return [];
    }

    return [
      {
        eventId: event.id,
        sportKey: event.sport_key,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        marketKey,
        selections,
        impliedProbability,
        edge: 1 - impliedProbability,
      },
    ];
  });
