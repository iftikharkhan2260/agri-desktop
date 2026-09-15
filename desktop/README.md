# Agri Shop — Desktop (Electron)

Full feature parity with the mobile app, running as a real Windows/Mac/
Linux desktop application. Built by reusing the exact same tested backend
logic (`electron/handlers/`, identical to `server/handlers/` and
`app/src/localapi/handlers/`) and reusing the mobile UI screens via
React Native Web — so all 16+ modules (Zamindars, Kisans, Guarantors,
Stock, Menu/Orders, Order Board, Settlements, Payments, Collections,
Reports, HR, Shop Settings, Licensing, Sync) work the same way here.

## Before first run

1. Download the 5 font files into `public/fonts/` — see the note file
   already in that folder for links. Needed for correct Urdu rendering
   everywhere, including printed receipts/PDFs.
2. Deploy the licensing Google Apps Script (see `/licensing/README.md` at
   the project root) and paste the URL into `electron/licenseConfig.js`.
3. (Optional) Add real icons in `build-resources/` — see the note there.

## Running it for development

```bash
npm install
npm run dev
```

This starts Vite's dev server and opens the Electron window pointed at it,
with hot-reload for the UI.

## Building the installer

```bash
npm run dist
```

Produces an installer in `release/` for whichever OS you run this command
on (Windows -> .exe, Mac -> .dmg, Linux -> .AppImage). Since
`better-sqlite3` is a native module, you can only build for the OS you're
currently running on -- see `/BUILD_EXE_GUIDE.md` at the project root for
how to get all three (Windows, Mac, Linux) built automatically without
installing anything locally.

## How data works here

Same model as the mobile app: this computer is **Standalone** (its own
local database, works with zero setup) until you choose otherwise from
**Sync Settings** in the sidebar. From there you can:
- **Become Host** -- let phones (running the mobile app) or other desktop
  installs connect to and share this computer's data.
- **Join as Client** -- connect this computer to another Host instead.

The desktop app and the mobile app speak the exact same networking
protocol, so a shop can freely mix phones and desktop computers on the same
shared data.

## Default login

Username `owner`, password `owner123` -- change this immediately from the
HR screen before real use, same as the mobile app.

## Known scope notes

- The 10-minute order-edit window, license bypass (7 taps on the License
  screen's title), and every other behavior from the mobile app carries
  over unchanged -- same handler code, same rules.
- Printed receipts and "Get PDF" exports use a native Save/Print dialog
  (via Electron) instead of a share sheet, and embed the bundled fonts
  directly so Urdu renders correctly regardless of what's installed on the
  computer printing it.
- I was not able to actually run `npm install` / build this in the sandbox
  I worked in (no internet access there) -- every file has been syntax-
  checked, and the architecture mirrors the already-working mobile app
  closely, but please treat your first `npm run dev` as the real test and
  report anything that doesn't come up cleanly.
