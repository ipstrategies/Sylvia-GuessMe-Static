# Sylvia GuessMe — Static Edition (GitHub Pages)

This is a **static-only** version of Sylvia GuessMe: **no server, no database**.
It runs entirely in the browser using JSON character packs and localStorage.

## Run locally
Browsers block `fetch()` from `file://`, so use a tiny local server:

### Option A: VS Code Live Server
1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**

### Option B: Python
```bash
python -m http.server 8080
```
Open:
`http://localhost:8080`

## Deploy to GitHub Pages (free)
1. Create a GitHub repo, e.g. `sylvia-guessme`
2. Push these files to the repo root
3. In GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
4. Your site will be at:
`https://<your-username>.github.io/<repo-name>/`

## Packs
- `data/minecraft.json`
- `data/disney.json`
- `data/mario.json`

Add new characters by editing those JSON files.

## Notes
- Scores + selected pack are stored in **localStorage** (per device).
