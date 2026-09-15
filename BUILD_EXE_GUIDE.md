# Getting a .exe Made — Entirely Online, No Local Install

This turns the desktop app into a real, double-click-to-install `.exe`
(plus Mac and Linux builds, if you want them) using GitHub's free build
servers. You never install Node.js, Electron, or anything else on your own
computer for this — just a web browser and a free GitHub account.

## Step 1 — Get the project onto GitHub

1. Create a free account at https://github.com if you don't have one.
2. Create a new repository (Settings icon → "New repository"). Any name,
   Private is fine.
3. Upload the whole `agri-shop` project folder to it. Easiest way with no
   command line: on the repository page, click **"Add file" → "Upload
   files"**, then drag the whole folder in. (For a project this size, using
   GitHub Desktop — a free app, also no command line — is smoother than the
   browser uploader; either works.)

## Step 2 — Add the build workflow file

In your repository, create a new file at exactly this path:
`.github/workflows/build.yml`

(On GitHub's website: "Add file" → "Create new file", type that whole path
into the filename box — GitHub creates the folders for you.)

Paste this in:

```yaml
name: Build Desktop App

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'desktop/**'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: ./desktop
        run: npm install

      - name: Build
        working-directory: ./desktop
        run: npm run dist

      - name: Upload build output
        uses: actions/upload-artifact@v4
        with:
          name: agri-shop-${{ matrix.os }}
          path: |
            desktop/release/*.exe
            desktop/release/*.dmg
            desktop/release/*.AppImage
```

Commit the file (there's a green "Commit changes" button on GitHub's editor).

## Step 3 — Run the build

1. Go to the **"Actions"** tab of your repository.
2. Click **"Build Desktop App"** in the left list.
3. Click **"Run workflow"** (top right) → **"Run workflow"** again to confirm.
4. Wait — this takes roughly 5–15 minutes. GitHub is compiling the app on
   real Windows, Mac, and Linux machines in the cloud, simultaneously.

## Step 4 — Download your .exe

1. When the run finishes (green checkmark), click into that run.
2. Scroll down to **"Artifacts"**.
3. Download **`agri-shop-windows-latest`** — inside is your installable
   `.exe`. (Also grab the Mac/Linux ones if you want those too.)
4. Share that `.exe` with anyone who needs to install the app on their
   shop computer — they just double-click it like any other Windows
   installer. No Node, no terminal, no GitHub account needed on their end.

## After this, every future update

Any time you change files inside `desktop/`, push the change to GitHub
(via the website's "Upload files" or GitHub Desktop) and the workflow runs
again automatically — you just repeat Step 4 to grab the new `.exe`.

## Notes

- This builds on GitHub's own servers for free (public repos get unlimited
  free minutes; private repos get a generous free monthly quota — plenty
  for occasional builds like this).
- The `better-sqlite3` native module gets compiled fresh for each target OS
  automatically as part of `npm install` on GitHub's servers — this is
  exactly why the Windows build must happen on `windows-latest` and so on;
  you can't cross-compile a native module from one OS for another, which is
  the whole reason this workflow builds on three separate machines.
- If you skipped adding real icons (see `desktop/build-resources/README.txt`),
  the build still succeeds — it just ships with electron-builder's default
  icon instead of your shop's branding.
- If a build fails, click into the red ✕ run and read the log — the two
  most common causes are a typo in `build.yml`'s indentation (YAML is
  whitespace-sensitive) or a missing dependency in `desktop/package.json`.
