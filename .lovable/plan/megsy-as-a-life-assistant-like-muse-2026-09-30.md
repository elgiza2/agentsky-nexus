# Megsy as a life assistant (like Muse)

The goal: Megsy stops being "a chat you open" and becomes an assistant that knows your goals, schedule and tasks, reminds you on its own, and gets things done.

## Suggestions (what makes the AI part of the user's whole life)

1. **Goals and Tasks page** (like the reference image): a "Goals" list with tick boxes, done items greyed out, and an "Ideas" card next to it where Megsy suggests things it can do for you ("I can plan your trip", "I can book your lesson") based on your goals and memory. Tapping an idea sends it to the agent.
2. **Megsy writes to you first**: every morning you get a short plan for the day ("You have 3 tasks, a meeting at 2, don't forget X"). In the evening you get a quick review. You also get reminders before deadlines. These arrive as phone notifications and as a message in the chat.
3. **Controls your calendar**: after you connect your Google Calendar, you can say "put a meeting with Ahmed on Thursday at 5". Megsy adds it, moves it or cancels it, and reads your free time when it plans.
4. **Alarms and reminders on the phone**: "wake me at 7" or "remind me to take my medicine every day at 9". This works once the app is wrapped for Android. Until then, reminders come as notifications.
5. **Asks before it acts**: anything that changes your calendar, sends something or spends money shows the existing "Allow / Deny" card first.
6. **Learns about you**: goals, habits and preferences go into the Memory page, so suggestions and reminders get more personal over time.
7. **Weekly check-in on goals**: "You're 60% toward your savings goal — want me to split what's left into weekly steps?"

## What gets built now (step 1)

- A new **Tasks page** (`/tasks`) with Goals, Tasks and Ideas sections. It uses a clean dark and light neutral look (no colours), with Arabic and English text.
- The agent can create, complete and schedule tasks and goals from inside the chat, using its own internal tools.
- **Reminders**: every task can have a due time. Megsy sends a notification plus a chat message when it's due, plus the daily morning plan.
- **Google Calendar**: each user connects their own account from the Integrations page. The agent can read, add, change and remove events, with approval first.
- **Alarms**: the button and the data are ready now. The real phone alarm gets switched on when the Android version is built.

## Technical details

- DB migration: `goals`, `tasks` (title, notes, due_at, remind_at, repeat rule, status, goal_id, source: user|agent), `agent_ideas`, and `scheduled_nudges` (user_id, kind: reminder|daily_brief|weekly_review, run_at, sent_at). All get RLS scoped to `auth.uid()` plus the required GRANTs.
- Agent tools: new internal actions inside `media-video` under `kind: "life"` (no new edge functions allowed). These are create_task, complete_task, list_tasks, create_goal, calendar_list, calendar_create, calendar_update and calendar_delete. The calendar writes go through the existing approval flow.
- Google Calendar: App User Connector `google_calendar` with scopes `calendar.events`. Each user's connection key is stored encrypted in `app_user_connections`, and calls happen from server functions.
- Reminders: one pg_cron job runs every 5 minutes (288 runs a day). It calls a `/api/public/nudges` route, verified by a secret. That route picks up due `scheduled_nudges`, sends web push using the existing `push_subscriptions`, and writes a chat message. It's a single job with a bounded batch per run.
- Alarms (later): a Capacitor wrapper with Local Notifications plus the Android AlarmClock intent. The `tasks.kind = 'alarm'` field is ready for it.
- Update `AGENTS.md` and `roadmap.md`.

## Needs from you later

- Approve the Google Calendar connection setup when the card shows up.
- A go-ahead when you want to start the Android wrapper.
