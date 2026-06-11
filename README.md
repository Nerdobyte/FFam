# Family FIFA — Match of the Day

A lightweight Next.js + Firebase family sweepstake. Pick today's winner before kickoff, see community picks after you vote, and climb the leaderboard across a full tournament.

## Layout

| Desktop | Mobile (top → bottom) |
|---------|------------------------|
| Left: Leaderboard | Match of the Day + countdown |
| Center: Match card + **You picked X** | My Pick |
| Right: Community % + vote counts | Community (after voting) |
| | Leaderboard |

## Features

- **Invite code login** with `authUid` linked to anonymous Firebase auth
- **Match of the Day** — auto-selected: soonest upcoming non-completed match
- **Today's fixtures** — all matches on today's date; vote on each until its kickoff
- **Historical matches** — stored as `matches/{matchId}`, never hardcoded
- **One vote per user per match** — doc ID `{matchId}_{userId}`, updatable until kickoff
- **Community results hidden** until you vote (server-side aggregation)
- **Idempotent scoring** — Firestore transaction + `scored` flag prevents double points
- **Admin panel** — create match, edit kickoff, set winner (all server-side)

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
npm run seed
firebase deploy --only firestore
```

## Firestore schema

### `users/{userId}`

```ts
{ name: string, code: string, points: number, correctPredictions: number, totalPredictions: number, authUid?: string }
```

### `matches/{matchId}`

```ts
{
  teamA: string,
  teamB: string,
  startTime: timestamp,
  endTime: timestamp,
  result: "teamA" | "teamB" | null,
  completed: boolean,
  scored: boolean        // prevents duplicate point awards
}
```

### `votes/{matchId}_{userId}`

```ts
{
  matchId: string,
  userId: string,
  prediction: "teamA" | "teamB",
  createdAt: timestamp,
  updatedAt?: timestamp
}
```

## Match of the Day selection

All matches are fetched with `orderBy('startTime', 'asc')`, then sorted deterministically in code.

`getMatchOfTheDay()` returns:

1. First match where `!completed && startTime > now` (next fixture)
2. Else the most recently completed match (latest result)
3. Else `null`

Helpers: `getUpcomingMatch()`, `getLatestCompletedMatch()`, `sortMatchesByStartTime()`

## Security

| Rule | Detail |
|------|--------|
| Votes read | Users can only read **their own** vote |
| Votes write | Create/update only before kickoff, only own vote |
| Community totals | `/api/votes/totals` — requires auth + existing vote |
| Admin | `ADMIN_SECRET` server-only, httpOnly session cookie |
| Scoring | Transaction checks `scored == false` before awarding points |

## Firestore indexes

Defined in `firestore.indexes.json`:

| Collection | Fields | Used by |
|------------|--------|---------|
| `matches` | `startTime` ASC | Match of the Day query (all matches) |
| `matches` | `completed` ASC, `startTime` ASC | Legacy — no longer required for MOTD |
| `votes` | `matchId` ASC, `prediction` ASC | Admin scoring |

Deploy with:

```bash
firebase deploy --only firestore
```

## Admin (`/admin`)

1. Enter `ADMIN_SECRET` (validated server-side, never exposed to client)
2. **Create match** — teams, kickoff, optional end time
3. **Edit kickoff** — update start time before match completes
4. **Set winner** — calls `settleMatch()` via `/api/admin/set-winner`: awards +1 point per correct prediction, updates stats (once only)

## Scoring (`lib/settle-match.ts`)

When admin sets a winner, `settleMatch(matchId, winner)` runs in a Firestore transaction:

1. Verifies `scored == false` (idempotent)
2. Fetches all votes for the match
3. For each voter: `totalPredictions` +1; if correct: `correctPredictions` +1 and `points` +1
4. Sets `result`, `completed: true`, `scored: true` on the match

## Environment variables

| Variable | Client? | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_FIREBASE_*` | Yes | Firebase web config |
| `ADMIN_SECRET` | **No** | Admin authentication |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **No** | Server API routes |

## Tournament-ready

The schema supports a full World Cup without changes:

- Many matches with unique `{matchId}` values
- Completed matches kept for history
- Points accumulate on `users.points` across all rounds
- Match of the Day always surfaces the current active fixture
