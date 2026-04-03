# Fairway Live

Fairway Live is a browser-based golf tournament tracker with:

- A player scoring page
- A dedicated live leaderboard page
- A protected admin page
- A results page for completed tournaments
- Multi-tournament support with one tournament designated as the public live leaderboard

## Pages

- `/Users/danielyoo/Documents/Playground/index.html`: player scoring for the current live tournament
- `/Users/danielyoo/Documents/Playground/leaderboard.html`: public leaderboard for the tournament marked live in admin
- `/Users/danielyoo/Documents/Playground/results.html`: archive of completed tournaments
- `/Users/danielyoo/Documents/Playground/admin.html`: admin console

## Run

```bash
python3 -m http.server 8000
```

Then open:

- [http://localhost:8000/index.html](http://localhost:8000/index.html)
- [http://localhost:8000/leaderboard.html](http://localhost:8000/leaderboard.html)
- [http://localhost:8000/results.html](http://localhost:8000/results.html)
- [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

## Admin Access

- Admin code: `pga`

## Seed Setup

- One live tournament is included by default: `Spring Invitational`
- One completed tournament is included by default: `Winter Classic`

## Admin Workflow

Use the admin page to:

- Choose which tournament you are editing
- Create another tournament using the current setup as a template
- Duplicate an existing tournament into a new one
- Mark one tournament as the live public leaderboard event
- Mark tournaments as `live`, `upcoming`, or `completed`
- Edit tournament name, course name, leaderboard intro text, players, handicaps, yardage, par, and stroke index
- Manage tournaments in scoped admin tabs for `Settings`, `Players`, and `Course`
- Add and remove players per tournament so each event can have its own field
- Reuse saved course templates when creating a tournament
- Apply a saved course template to the tournament you are editing
- Save the current tournament course as a reusable course template

## Notes

- The app still keeps a browser-local fallback copy of tournament data
- If [supabase-config.js](/Users/danielyoo/Documents/Playground/supabase-config.js) is present, the scoring page, leaderboard, and admin pages now sync through Supabase
- Player and admin sign-in still stay on the device/browser they used
- The current app is still a frontend MVP, so player/admin codes are convenience gates rather than secure authentication

## Supabase Prep

If you want real shared sync across desktop and mobile:

1. Open [SUPABASE_SETUP.md](/Users/danielyoo/Documents/Playground/SUPABASE_SETUP.md)
2. Create `supabase-config.js` from [supabase-config.example.js](/Users/danielyoo/Documents/Playground/supabase-config.example.js)
3. Run [supabase-schema.sql](/Users/danielyoo/Documents/Playground/supabase-schema.sql) in the Supabase SQL editor
4. Run locally or deploy to Vercel
5. The scoring page, leaderboard, and admin pages will sync through Supabase
