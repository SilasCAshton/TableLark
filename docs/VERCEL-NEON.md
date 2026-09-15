# Deploy TableLark with Vercel and Neon

The app already connects to PostgreSQL with Drizzle and `pg`. No additional
database driver is needed. Deploy the Next.js app with its server routes.

1. In the Vercel project, open Storage and create or connect a Neon database
   through the Marketplace. Choose the plan and region appropriate for the
   project, ideally near the Vercel server region. Connect the production
   resource to the Production environment. Use a separate database or Neon
   branch for Preview deployments.
2. In Vercel environment variables, verify `DATABASE_URL` contains the Neon
   pooled connection string and `DATABASE_URL_UNPOOLED` contains the direct
   connection string for the same database and branch. If the integration
   does not provide the latter, copy the direct connection from Neon. Keep
   the supplied TLS query parameters. Both variables are server-only.
3. Verify these existing Google variables are configured for the deployment:
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`, and
   `GOOGLE_PLACES_API_KEY`. Authorize the deployed website in the browser
   key's referrer restrictions.
4. Keep Vercel's Build Command on its project default. The checked-in
   `vercel.json` runs `npm run db:migrate && npm run build`, so a deployment
   cannot become ready with an unavailable database or an outdated schema.
   If the Vercel project has a custom Build Command, remove that override or
   set it to the same command.
   The migration runner prefers `DATABASE_URL_UNPOOLED`, falling back to
   `DATABASE_URL` for local development. The direct Neon connection is
   required because the runner uses a session-level advisory lock, which
   is incompatible with transaction pooling. Each deployment environment
   using this build command needs its own configured database connection.
5. Commit and push the changes to the GitHub branch Vercel should deploy.
   Check Vercel's configured Production Branch: a push to another branch
   normally creates a Preview deployment. Merge the feature branch into
   the production branch when ready to release it.
6. Trigger a fresh deployment after configuring the environment and build
   command. Confirm the initial build logs show both migrations applied:
   `0001_create_polling_schema.sql` and
   `0002_add_poll_option_primary_type.sql`. Later runs skip unchanged applied
   migrations. Do not edit migration files after they have been applied.
7. In the deployed app, search for restaurants, create a Lark Together poll,
   open its shared link in a private window, vote, and verify results.

Pushing code does not copy a local database. These migrations create the
hosted schema; local polls remain local. Future migrations run before the
new deployment is live, so keep them compatible with the currently running
app. A failed app build does not undo a successful database migration.

Never commit real database URLs or environment files. The local Docker setup
(`db:setup` and `test:db`) is separate from hosted deployment.

References:

- [Vercel Marketplace storage](https://vercel.com/docs/marketplace-storage)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)
