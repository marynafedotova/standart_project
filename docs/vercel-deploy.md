# Vercel deployment checklist

## Recommended production setup

- Hosting: Vercel
- Database: Neon Postgres via Vercel Marketplace
- ORM: Prisma

## Why this is the best fit

- The project already uses Next.js and Prisma
- Vercel is the native deployment target for Next.js
- Neon is the recommended managed Postgres path on Vercel Marketplace
- Environment variables can be injected directly into the project settings

Official references:

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Postgres on Vercel](https://vercel.com/docs/postgres)
- [Neon integration](https://vercel.com/marketplace/neon)

## Environment variables to configure in Vercel

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SITE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ORDER_EMAIL_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Suggested deployment flow

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Install Neon from the Vercel Marketplace for this project.
4. Copy the pooled Neon connection string into `DATABASE_URL` if it is not injected automatically.
5. Copy the direct Neon connection string into `DIRECT_URL`.
6. Set `NEXT_PUBLIC_SITE_URL` to the final Vercel domain or custom domain.
7. Set all auth, email, and Telegram environment variables.
8. Deploy the project.
9. After the first deployment, run `prisma db push` against the production database.

## Important note

Use the pooled Neon URL for runtime traffic and the direct URL for Prisma CLI commands. This project currently uses `prisma db push`, not Prisma Migrate. That is acceptable for an admin-managed store MVP, but for long-term production evolution it is better to move to explicit migrations later.
