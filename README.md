# VerifiedMeasure Platform (v3)

## What you built
A unified, multi-vertical, credit/entitlement-gated intelligence platform running on Next.js 14 + Supabase (anon-only client). Auth is client-side only and all unlock/billing happens via your deployed RPCs + ledger.

## Deploy requirements (Vercel)
Set **only** these environment variables in Vercel (Production + Preview + Development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No `.env` files are included or required.

## Local dev
```bash
npm install
npm run dev
```

## Configure your schema
Update `lib/verticals.ts` to match your **deployed** table names, access tables, and RPC signatures.
