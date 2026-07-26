This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Auth setup (local dev)

Sign-in uses Auth.js (next-auth v5) with Google and GitHub OAuth — no email/password.

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `AUTH_SECRET` (generate one with `openssl rand -base64 32`).
2. Create OAuth apps for whichever provider(s) you want to test locally:
   - **Google**: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth client ID (Web application). Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
   - **GitHub**: [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`.
3. Fill in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` and/or `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` in `.env`.

You don't need both providers configured — `/login` only shows sign-in buttons for providers with credentials present, and degrades gracefully (with a dev-only notice) if neither is set.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
