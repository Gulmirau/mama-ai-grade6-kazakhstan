# Mama AI Cloud Backend

Mama AI now has a cloud-ready backend boundary.

Chosen cloud provider:

- `supabase`

Current fallback mode:

- local JSON, until Supabase credentials are added
- data is stored in `data/db.json` and `data/knowledge_base.json`
- good for local testing and demos

Production mode needs:

- authentication for student and parent accounts
- shared database
- file storage for photos and imported textbooks
- OCR queue
- analytics storage
- Knowledge Base review workflow

## Environment

Use `.env`:

```env
CLOUD_BACKEND_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=mama-ai-files
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
INACTIVITY_WARNING_DAYS=30
INACTIVITY_GRACE_DAYS=3
EMAIL_PROVIDER=disabled
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Supported status endpoint:

`GET /api/cloud/status`

The current implementation reports whether cloud variables are configured. The app keeps working on local JSON until a real provider is connected.

Supabase free plan is suitable for the first prototype, but it has limits: 500 MB database, 1 GB file storage, 50,000 monthly active users, and projects pause after 1 week of inactivity. Keep this in mind before sharing widely.

To enable Supabase:

1. Create a Supabase project.
2. Open SQL Editor and run `knowledge_base/schema.sql`.
3. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into `.env`.
4. Restart the Mama AI server.
5. Check `GET /api/cloud/status`; it should show `provider: "supabase"` and `ready: true`.

Account lifecycle endpoints:

- `GET /api/account/lifecycle`
- `POST /api/account/lifecycle/run`

Default policy: after 30 days without login, Mama AI queues an email warning. If the student does not log in within 3 more days, the local student account and related local records are deleted. If the student logs in during the grace period, the scheduled deletion is cancelled.

Email sending is intentionally separated from the cleanup rule. Until a real provider is configured, warnings stay in the `notifications` queue with status `queued_email_provider_required`.

## New Product Features

- Student cabinet
- Parent cabinet
- Parent summary
- Weekly learning plan
- GIA / ENT trainer shell
- Weak-topic detection
- Recommendations
- Photo import status
- Cloud backend status
- Inactive student warning and cleanup policy

## Important

The GIA / ENT trainer currently uses demo diagnostic questions only. It does not claim to be an official question bank. Official tasks should be imported into the Knowledge Base and reviewed before they become trusted content.
