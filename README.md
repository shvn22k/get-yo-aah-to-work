# get-yo-aah-to-work

Accountability webapp for friends to stay on track together.

## Setup

```bash
npm install
```

Create `.env.local`:
```
VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

Run SQL from `supabase-setup.sql` in Supabase SQL Editor.

```bash
npm run dev
```

## Features

- Create rooms with up to 4 friends
- Personal to-do lists per person
- Daily check-ins and streak tracking
- Real-time leaderboard and progress
- Mobile-friendly design

## Contributing

Contributions welcome! Open an issue or submit a PR.
