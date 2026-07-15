# Mama AI Public Link

`localhost` works only on the computer where the app is running. To share Mama AI with other people, use a public host.

## Recommended Auto Update Setup

This project now includes a GitHub Pages workflow:

`.github/workflows/deploy-pages.yml`

After it is pushed to GitHub, every future push to `main` will automatically publish the public interface.

Expected public URL:

`https://gulmirau.github.io/mama-ai-grade6-kazakhstan/`

## One-Time GitHub Setting

In GitHub:

1. Open repository `Gulmirau/mama-ai-grade6-kazakhstan`.
2. Go to `Settings`.
3. Open `Pages`.
4. In `Build and deployment`, choose `GitHub Actions`.
5. Save.

After that, the workflow will deploy automatically on each push.

## Local Publish Command

From PowerShell, run:

```powershell
.\scripts\publish-public.ps1
```

This command:

- checks JavaScript syntax;
- rebuilds the public Worker bundle;
- rebuilds the static ZIP;
- commits changed public files;
- pushes to GitHub;
- triggers GitHub Pages deployment.

## Important Limitation

The GitHub Pages version is public and shareable, but it is static. It can show the Mama AI interface and local tutor behavior in the browser.

Persistent server features still need a cloud backend:

- saving photos permanently;
- OCR processing;
- OpenAI API calls from the server;
- persistent analytics;
- shared Knowledge Base storage.

For full production, connect a backend such as Supabase, Firebase, Render, Railway, or a Cloudflare Worker with durable storage.
