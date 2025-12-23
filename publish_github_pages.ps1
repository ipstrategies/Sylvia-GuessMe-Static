# Publish Sylvia GuessMe Static to GitHub Pages
# Run in repo root (where index.html exists)

git init
git add .
git commit -m "Sylvia GuessMe static edition"
git branch -M main

# Replace with your repo URL:
# git remote add origin https://github.com/<USERNAME>/<REPO>.git

git push -u origin main

Write-Host "Enable GitHub Pages:"
Write-Host "Repo Settings -> Pages -> Deploy from branch -> main /(root)"
