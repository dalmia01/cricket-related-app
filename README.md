# Cricket Signatures App

Simple Next.js app with a frontend form, digital signature canvas, and MongoDB backend to save signatures and messages.

Environment:

- Create a MongoDB URI and set it in `.env.local` as `MONGODB_URI`.

Run locally:

```bash
npm install
npm run dev
```

Open http://localhost:3000

Docker
------

Build the image:

```bash
docker build -t cricket-signatures .
```

Run the container (provide a MongoDB URI via env):

```bash
docker run -e MONGODB_URI="your-mongo-uri" -p 3000:3000 cricket-signatures
```

Notes
- The Docker image uses `npm start` for production. Ensure `MONGODB_URI` is set when running the container.

Vercel Deployment
-----------------

Recommended (Git integration):

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to https://vercel.com and import the project (New Project → Import from Git).
3. During import, add an Environment Variable named `MONGODB_URI` with your MongoDB connection string. Set it for `Production` (and optionally `Preview`).
4. Vercel will detect Next.js and build automatically. Deploy and your site will be live.

Using Vercel CLI:

```bash
# install CLI
npm i -g vercel

# run from project root and follow prompts
vercel

# add MONGODB_URI via CLI for production
vercel env add MONGODB_URI production
```

Notes for Vercel:
- Ensure `MONGODB_URI` is set in the project settings or via the CLI before visiting the site.
- If you need to set Node version, configure it in the Vercel project settings (Node 18+ recommended).


Realtime (Pusher) setup
------------------------

To enable realtime updates (so other machines see new signatures immediately), provide Pusher credentials and expose a public key for the client.

Server environment variables (set in `.env.local` or your host platform):

- `PUSHER_APP_ID` — your Pusher App ID
- `PUSHER_KEY` — your Pusher Key (also used on the client as `NEXT_PUBLIC_PUSHER_KEY`)
- `PUSHER_SECRET` — your Pusher Secret
- `PUSHER_CLUSTER` — your Pusher cluster (e.g. `mt1`)

Client environment variables (public):

- `NEXT_PUBLIC_PUSHER_KEY` — same value as `PUSHER_KEY`
- `NEXT_PUBLIC_PUSHER_CLUSTER` — same value as `PUSHER_CLUSTER`

Example `.env.local` (local development):

```
MONGODB_URI="your-mongo-uri"
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"
```

Notes:

- The server triggers an event after a successful MongoDB write; the client subscribes and refreshes the first page when a `created` event arrives.
- If realtime delivery fails, saves still succeed (server logs the trigger error but returns 201).


