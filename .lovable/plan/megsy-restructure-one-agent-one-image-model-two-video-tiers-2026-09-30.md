# Megsy restructure: one agent, one image model, two video tiers

## What the user will see

- **Chat page**: the suggestion chips and the tool picker are gone. There is just the message box. Whatever you ask, the one agent decides by itself what to do (answer, search, browse, build a site, make a file, make an image or video).
- **The agent (Browser Use Cloud, DeepSeek model only)** handles everything. The chat adapts to what actually happened:
  - The live computer screen only appears when the agent really opened a browser.
  - A file card only appears when the agent really produced a file (site, document, spreadsheet, code, etc.).
  - Otherwise it's a normal text reply.
- **Images**: one fixed model, GPT Image 2 through Runway (dev API), always at the lowest quality. No model picker.
- **Videos** (WaveSpeed):
  - Free users: MiniMax only, 1 video per day.
  - Subscribers: Seedance 2.5, 5 videos per day.
  - A clear message when the daily limit is reached. Other limits come later.

## Build steps

1. **Chat UI cleanup**: remove the starter chips, trending suggestions, mode bars and tool/model pickers from desktop and mobile chat. Keep attachments and send.
2. **Single agent pipeline**: every chat message goes to a new `agent-run` edge function that starts a Browser Use Cloud task using DeepSeek, then streams its steps back. The old tool router and per-mode paths (slides, research depth, computer mode toggle) are no longer reachable from the UI.
3. **Result rendering**: map the agent's output to what's shown. Live view only if a browser session URL exists; file cards only for returned output files (saved to our storage); plain answer otherwise.
4. **Internal media tools**: when the agent's task needs an image or video, our backend calls the fixed image/video path instead of the agent doing it:
   - `media-image` changed to GPT Image 2 on Runway, lowest quality.
   - `media-video` changed to WaveSpeed: MiniMax for free, Seedance 2.5 for subscribers, with daily limits enforced on the server (1 / 5) using a small usage-count table.
5. **Keys**: new providers `browser_use`, `runway`, `wavespeed` in the existing encrypted key store, added by admins at `/k`. No keys in the app code.
6. Update `roadmap.md` and the project handbook's provider table.

## Technical details

- New edge function `agent-run` (and a poll/stream companion): `take_service_key('browser_use')`, create task via Browser Use Cloud v2 API with `llm` set to its DeepSeek option, forward step events; read `live_url` / output files to decide rendering flags (`hasComputer`, `files[]`).
- Server-side video quota: table `video_daily_usage(user_id, day, count)` with grants + RLS; subscription check from the existing subscription data; enforced inside `media-video` before creating a WaveSpeed job; `media-video-poll` switched to WaveSpeed's prediction result endpoint.
- Exact model IDs (Runway GPT Image 2, WaveSpeed MiniMax and Seedance 2.5) and DeepSeek availability in Browser Use Cloud will be confirmed against the providers' docs before wiring; if DeepSeek isn't offered there, I'll stop and tell you.
- Edge functions deploy to the connected backend project.

## Needs from you

- Browser Use, Runway and WaveSpeed API keys, added at `/k` after this ships.
