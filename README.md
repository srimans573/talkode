# Talkode

AI-guided pre-OA technical screening for recruiter and hiring manager workflows.

## Local Setup

Install dependencies:

```bash
npm ci
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Apply the Supabase migration in `supabase/migrations` before using auth. It creates recruiter-only profile tables, row level security, and an auth trigger that accepts only `recruiter` and `manager` roles from signup metadata.

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000/auth`.
