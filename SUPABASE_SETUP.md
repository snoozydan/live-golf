# Supabase Setup

Use this checklist to get your Supabase project ready for shared live sync.

## What You Need

- Project URL
- Publishable key
- Supabase SQL editor

Your project URL should be:

`https://syptvmpmsqvurdzezbua.supabase.co`

## Step 1

Copy [supabase-config.example.js](/Users/danielyoo/Documents/Playground/supabase-config.example.js) to `supabase-config.js`

Then replace:

- `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE`

with your real Supabase publishable key.

## Step 2

In Supabase:

1. Open `SQL Editor`
2. Create a new query
3. Paste the contents of [supabase-schema.sql](/Users/danielyoo/Documents/Playground/supabase-schema.sql)
4. Run it

That creates tables for:

- tournaments
- players
- groups
- group player assignments
- holes
- scores
- recent score updates
- saved course templates

It also enables the main tables for Realtime.

## Step 3

Run the app locally or deploy it.

If you want to test on your own machine:

```bash
python3 -m http.server 8000
```

Then open:

- [http://localhost:8000/index.html](http://localhost:8000/index.html)
- [http://localhost:8000/leaderboard.html](http://localhost:8000/leaderboard.html)
- [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

If you want to test with other people, deploy the project to Vercel and open the same deployed URL on multiple devices.

## Important

- Do not share any Supabase secret key
- Only use the publishable key in `supabase-config.js`
- The publishable key is safe to use in a frontend app, so `supabase-config.js` can be deployed for demo use
