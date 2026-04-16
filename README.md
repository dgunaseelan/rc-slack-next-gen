# RevFlow — Slack App design mocks

A static viewer for 19 Block Kit JSON mocks covering the full Product-to-Cash flow (home tab, quote build, discount, approval, invoice, payment, AI assistant, proactive nudges).

## View it

Deployed to GitHub Pages: `https://<your-user>.github.io/rc-slack-next-gen/`

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080/
```

The root `index.html` redirects to `renderer/index.html`, which fetches mocks from `mocks/bkb/`.

## What's in the deploy

```
├── index.html         # redirects to renderer/
├── .nojekyll          # disables Jekyll so filenames with underscores are served as-is
├── renderer/          # the HTML viewer (HTML/CSS/JS)
└── mocks/
    ├── bkb/           # 19 Block Kit JSON mocks
    └── assets/        # chart SVGs
```

## Deploy to GitHub Pages

1. Create a GitHub repo and push this branch:
   ```bash
   gh repo create rc-slack-next-gen --public --source=. --remote=origin --push
   ```
2. On github.com: *Settings → Pages → Source: Deploy from a branch → Branch: `main` / root → Save.*
3. Share the `github.io` URL with your team once the green checkmark appears (~30 sec).

## Paste a mock into Block Kit Builder

Open any mock from the viewer's sidebar → click **"Open in Block Kit Builder ↗"** in the top bar to load it in Slack's BKB for preview/editing.
