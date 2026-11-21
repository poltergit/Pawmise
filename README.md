# Pawmise
Private couple's pet app. Static frontend (Netlify) + Express/MongoDB API. The supported implementation is `client/` with `server/src/`; the Anthropic key never leaves the server.

## Requirements
Node 18+, a MongoDB URI (Atlas free tier works), optional Anthropic API key (without it, questions come from a built-in pool).

## Run locally
```
cd server && cp .env.example .env   # fill MONGODB_URI, PAWMISE_KEY_A, PAWMISE_KEY_B, and optional AI/push settings
npm install && npm run dev
cd ../client && npm install && npm run build:css
npx serve . -l 8888                  # add http://localhost:8888 to ALLOWED_ORIGIN
```
First load asks for your passcode; it is stored in that browser.
Each partner has their own (`PAWMISE_KEY_A` / `PAWMISE_KEY_B`). The server derives who you are from it, so nobody can answer or rename in the other's place.

## Deploy
1. API: host `server/` on Render/Railway/Fly. Set every variable from `.env.example` (`ALLOWED_ORIGIN` = your Netlify URL).
2. Frontend: the deployed build uses `https://pawmise-3569.onrender.com` by default and localhost uses `http://localhost:8787`. Push to Netlify; `netlify.toml` builds the Tailwind CSS (no CDN).

## API (all under `/api`, header `x-pawmise-key`)
`GET /state` · `POST /tasks` · `PATCH /tasks/:id` · `DELETE /tasks/:id` · `POST /tasks/:id/complete` · `POST /question/answer {text}` · `POST /question/reveal` · `POST /question/next` (AI, 10/hr) · `GET /history` (memory book) · `POST /profile {petName|reroll|name}`
Stash: `POST /coupons {label,cost}` · `DELETE /coupons/:id` · `POST /coupons/:id/redeem` · `POST /stash/:id/use`
Every EXP point earned is also spendable currency (the wallet); redeeming a coupon spends it atomically and never lowers the pet's level.
Every route returns the full state. EXP, levels, streaks and the blind reveal are computed server-side; answers are not sent to the client until revealed.

## Two phones
You only ever see your own answer box; your partner's shows `still writing…` or a sealed envelope. Phones sync every 15s and when the tab regains focus. EXP, streak and bonus updates are atomic on the server.

## Also included
- **Install + offline shell:** `manifest.json` + `sw.js` (network-first shell cache). Add to home screen on Android/iOS. Note: icon is SVG; add 192/512 PNGs to the manifest if your browser wants them for the install prompt.
- **Push pings:** `npx web-push generate-vapid-keys`, set `VAPID_*`, deploy, then each partner taps *notify me* once. You get pinged when your partner finishes a task, seals an answer or breaks the seals. iOS needs the app added to the home screen first.
- **Editable tasks:** ✎ edits label + EXP, × deletes, any unfinished task. Finished tasks are locked.
- **Evolution gallery:** preview every pet stage and reroll the current look.
- **Task variety:** categories, daily/weekday/weekend/custom schedules, and optional partner approval.
- **Weekly goals, streak freezes, pet care:** track the week, protect one streak gap, and maintain happiness/comfort.
- **Memories:** add private notes, mood, photo URLs, anniversaries, and seasonal looks.
- **Question categories and notification preferences:** choose the reflection style and which pushes you receive.
- **Card collection:** collect 60 Golden Retriever cards in six themed sets, with ratings from 1 to 10, rarity weights, pity protection, level rewards, duplicates, and pawdust.
- **Tests:** `cd server && npm test` (day/timezone/EXP/fallback-question logic).
