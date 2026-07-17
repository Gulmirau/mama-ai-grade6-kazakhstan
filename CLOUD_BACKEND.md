# Mama AI Cloud Backend

Mama AI now has a cloud-ready backend boundary.

Current mode:

- `local-json`
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
CLOUD_BACKEND_PROVIDER=local-json
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Supported status endpoint:

`GET /api/cloud/status`

The current implementation reports whether cloud variables are configured. The app keeps working on local JSON until a real provider is connected.

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

## Important

The GIA / ENT trainer currently uses demo diagnostic questions only. It does not claim to be an official question bank. Official tasks should be imported into the Knowledge Base and reviewed before they become trusted content.
