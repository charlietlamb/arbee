import { expect, test } from "bun:test";

import type { OddsEvent } from "../odds-api/types.ts";
import { findArbitrageCandidates } from "./arbitrage.ts";

const createEvent = (bookmakers: OddsEvent["bookmakers"]): OddsEvent => ({
  id: "12345678901234567890123456789012",
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: "2026-04-20T12:00:00Z",
  home_team: "Home",
  away_team: "Away",
  bookmakers,
});

test("returns no candidates when implied probability is not below one", () => {
  const candidates = findArbitrageCandidates([
    createEvent([
      {
        key: "a",
        title: "Book A",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 1.8 },
              { name: "Away", price: 2.0 },
            ],
          },
        ],
      },
      {
        key: "b",
        title: "Book B",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 1.9 },
              { name: "Away", price: 1.95 },
            ],
          },
        ],
      },
    ]),
  ]);

  expect(candidates).toEqual([]);
});

test("returns a candidate when best prices create a two-way arb", () => {
  const candidates = findArbitrageCandidates([
    createEvent([
      {
        key: "a",
        title: "Book A",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 2.2 },
              { name: "Away", price: 1.7 },
            ],
          },
        ],
      },
      {
        key: "b",
        title: "Book B",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 1.8 },
              { name: "Away", price: 2.3 },
            ],
          },
        ],
      },
    ]),
  ]);
  const candidate = candidates[0];

  expect(candidate).toBeDefined();
  if (!candidate) {
    throw new Error("Expected candidate");
  }
  expect(candidate).toMatchObject({
    eventId: "12345678901234567890123456789012",
    marketKey: "h2h",
    selections: [
      {
        outcomeName: "Away",
        price: 2.3,
        bookmakerKey: "b",
      },
      {
        outcomeName: "Home",
        price: 2.2,
        bookmakerKey: "a",
      },
    ],
  });
  expect(candidate.edge).toBeCloseTo(1 - (1 / 2.2 + 1 / 2.3), 10);
});

test("returns a candidate for a three-way h2h arb", () => {
  const candidates = findArbitrageCandidates([
    createEvent([
      {
        key: "a",
        title: "Book A",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 3.6 },
              { name: "Draw", price: 3.0 },
              { name: "Away", price: 2.8 },
            ],
          },
        ],
      },
      {
        key: "b",
        title: "Book B",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 3.1 },
              { name: "Draw", price: 3.8 },
              { name: "Away", price: 2.9 },
            ],
          },
        ],
      },
      {
        key: "c",
        title: "Book C",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 3.2 },
              { name: "Draw", price: 3.1 },
              { name: "Away", price: 3.4 },
            ],
          },
        ],
      },
    ]),
  ]);
  const candidate = candidates[0];

  expect(candidate).toBeDefined();
  if (!candidate) {
    throw new Error("Expected candidate");
  }
  expect(candidate.selections).toEqual([
    {
      outcomeName: "Away",
      price: 3.4,
      bookmakerKey: "c",
      bookmakerTitle: "Book C",
    },
    {
      outcomeName: "Draw",
      price: 3.8,
      bookmakerKey: "b",
      bookmakerTitle: "Book B",
    },
    {
      outcomeName: "Home",
      price: 3.6,
      bookmakerKey: "a",
      bookmakerTitle: "Book A",
    },
  ]);
  expect(candidate.impliedProbability).toBeLessThan(1);
});

test("chooses the highest price per outcome", () => {
  const candidates = findArbitrageCandidates([
    createEvent([
      {
        key: "a",
        title: "Book A",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 2.15 },
              { name: "Away", price: 2.05 },
            ],
          },
        ],
      },
      {
        key: "b",
        title: "Book B",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 2.25 },
              { name: "Away", price: 2.0 },
            ],
          },
        ],
      },
      {
        key: "c",
        title: "Book C",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: 2.05 },
              { name: "Away", price: 2.2 },
            ],
          },
        ],
      },
    ]),
  ]);
  const candidate = candidates[0];

  expect(candidate).toBeDefined();
  if (!candidate) {
    throw new Error("Expected candidate");
  }
  expect(candidate.selections).toEqual([
    {
      outcomeName: "Away",
      price: 2.2,
      bookmakerKey: "c",
      bookmakerTitle: "Book C",
    },
    {
      outcomeName: "Home",
      price: 2.25,
      bookmakerKey: "b",
      bookmakerTitle: "Book B",
    },
  ]);
});

test("ignores non-h2h markets and invalid outcomes", () => {
  const candidates = findArbitrageCandidates([
    createEvent([
      {
        key: "a",
        title: "Book A",
        markets: [
          {
            key: "spreads",
            outcomes: [
              { name: "Home", price: 2.5 },
              { name: "Away", price: 2.5 },
            ],
          },
          {
            key: "h2h",
          },
        ],
      },
      {
        key: "b",
        title: "Book B",
        markets: [
          {
            key: "h2h",
            outcomes: [
              { name: "Home", price: -1 },
              { name: "Away", price: 2.5 },
            ],
          },
        ],
      },
    ]),
  ]);

  expect(candidates).toEqual([]);
});
