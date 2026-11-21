# Pawmise
Private couple's pet app. Static frontend (Netlify) + Express/MongoDB API. The Anthropic key never leaves the server.

## Requirements
Node 18+, a MongoDB URI (Atlas free tier works), optional Anthropic API key (without it, questions come from a built-in pool).

## Run locally
```
cd server && cp .env.example .env   # fill MONGODB_URI, PAWMISE_KEY, ANTHROPIC_API_KEY
npm install && npm run dev
cd ../client && npm install && npm run build:css
npx serve . -l 8888                  # or open index.html; add the origin to ALLOWED_ORIGIN
```
First load asks for your passcode; it is stored in that browser.
Each partner has their own (`PAWMISE_KEY_A` / `PAWMISE_KEY_B`). The server derives who you are from it, so nobody can answer or rename in the other's place.

## Deploy
1. API: host `server/` on Render/Railway/Fly. Set every variable from `.env.example` (`ALLOWED_ORIGIN` = your Netlify URL).
2. Frontend: set `client/config.js` to the API URL, push, connect the repo to Netlify. `netlify.toml` builds the Tailwind CSS (no CDN).

## API (all under `/api`, header `x-pawmise-key`)
`GET /state` · `POST /tasks` · `DELETE /tasks/:id` · `POST /tasks/:id/complete` · `POST /question/answer {slot,text}` · `POST /question/reveal` · `POST /question/next` (AI, 10/hr) · `GET /history` (memory book) · `POST /tasks/:id/complete {slot}` · `POST /profile {petName|reroll|slot,name}`
Stash: `POST /coupons {label,cost}` · `DELETE /coupons/:id` · `POST /coupons/:id/redeem` · `POST /stash/:id/use`
Every EXP point earned is also spendable currency (the wallet); redeeming a coupon spends it atomically and never lowers the pet's level.
Every route returns the full state. EXP, levels, streaks and the blind reveal are computed server-side; answers are not sent to the client until revealed.

## Two phones
You only ever see your own answer box; your partner's shows `still writing…` or a sealed envelope. Phones sync every 15s and when the tab regains focus. EXP, streak and bonus updates are atomic on the server.

## Also included
- **Install + offline shell:** `manifest.json` + `sw.js` (network-first shell cache). Add to home screen on Android/iOS. Note: icon is SVG; add 192/512 PNGs to the manifest if your browser wants them for the install prompt.
- **Push pings:** `npx web-push generate-vapid-keys`, set `VAPID_*`, deploy, then each partner taps *notify me* once. You get pinged when your partner finishes a task, seals an answer or breaks the seals. iOS needs the app added to the home screen first.
- **Editable tasks:** ✎ edits label + EXP, × deletes, any unfinished task. Finished tasks are locked.
- **Tests:** `cd server && npm test` (day/timezone/EXP/fallback-question logic).
