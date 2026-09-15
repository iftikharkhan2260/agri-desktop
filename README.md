# Agri Shop

> **Start here:** the hosting/networking architecture described below in
> "Build Stage 1" (an Express server you run with `npm start`) has been
> **replaced twice since**. Skip straight to **"Stage 4"** near the bottom
> of this file for how the app works now — it opens straight to Login with
> zero setup, and networking is an optional drawer entry. Everything above
> that section still describes the features correctly; only the *how do
> devices talk to each other* part changed.

# Agri Shop — Build Stage 1 (Foundation)

This stage includes: server foundation with auth + roles, bilingual (English/Urdu)
app shell, navy/green theme, and full CRUD for **Zamindars**, **Kisans**, and
**Guarantors** (sections 1–3 of your spec).

Not yet built (coming in later stages): Stock, Menu/Ordering, Order Board,
Settlements, Collections, Reports, HR, Shop Settings, WhatsApp backup.

## Architecture

- **`/server`** — Node.js + Express + SQLite (better-sqlite3). Run this on ONE
  device (a phone in Termux, or a cheap PC/laptop) — it is the "host". This
  matches your item 13 request for a WiFi/Hotspot hosting guide: there is no
  cloud hosting cost, everything stays on your local network.
- **`/app`** — the Expo/React Native app every salesman/employee installs.
  Each phone connects to the host device's local IP address over WiFi or a
  phone hotspot.

## 1. Set up the server (host device)

```bash
cd server
npm install
npm start
```

You'll see something like:
```
Agri Shop server running on http://0.0.0.0:4000
```

Find the host device's local IP:
- **Termux (Android)**: `ip addr show wlan0` — look for `inet 192.168.x.x`
- **Windows**: `ipconfig` — "IPv4 Address"
- **Mac/Linux**: `ifconfig` or `ip addr`

Default login created on first run: **username `owner`, password `owner123`**.
**Change this password immediately** — this stage doesn't yet have a
"change password" screen; ask for it in the next stage if you need it sooner,
or update it directly in the database for now.

## 2. Hosting guide — WiFi / Hotspot

**Option A — Shop WiFi router**
1. Connect the host device (where `npm start` is running) to your shop WiFi.
2. Note its local IP (see above) — it should stay the same if your router
   supports DHCP reservation (set this in your router settings so the IP
   never changes).
3. Every phone with the Agri Shop app connects to the *same* WiFi.
4. In the app, the API address is currently set in
   `app/src/api/client.js` (`getBaseUrl` default) — set it to
   `http://<host-ip>:4000`. A proper in-app Settings field for this is
   planned for the Shop Settings stage.

**Option B — Phone hotspot (no router needed)**
1. On the host phone, turn on Mobile Hotspot, run the server there via Termux.
2. Other phones join that hotspot's WiFi network.
3. The host phone's hotspot IP is usually `192.168.43.1` on Android — use
   that as the API address.

**Bluetooth**: Bluetooth cannot carry a normal HTTP/REST connection the way
this app is built (Express + fetch), so it isn't used for syncing data.
WiFi/hotspot is the reliable option and is what this build uses.

## 3. Termux guide — testing on your phone

1. Install **Termux** and **Termux:API** (F-Droid build recommended over
   Play Store for full permissions).
2. Inside Termux:
   ```bash
   pkg update && pkg upgrade
   pkg install nodejs-lts git
   ```
3. Copy this project into Termux storage (e.g. via `termux-setup-storage`
   then copying into `~/storage/shared/agri-shop`, or `git clone` if you push
   it to a repo).
4. Run the server (see step 1 above) inside Termux — this is your host.
5. On the SAME device or another device on the same WiFi/hotspot, install
   **Expo Go** from the Play Store.
6. In a second Termux session (or another machine), run:
   ```bash
   cd app
   npm install
   npx expo start
   ```
7. Scan the QR code with Expo Go (make sure the phone running Expo Go is on
   the same WiFi/hotspot as the server).
8. Update `getBaseUrl`'s default in `app/src/api/client.js` to your host
   device's IP before testing, or the app won't reach the server.

## 4. Security notes for this stage

- Passwords are hashed with bcrypt, never stored in plain text.
- Login is JWT-based, tokens expire after 12 hours.
- Login attempts are rate-limited (10 per 15 minutes) to slow brute-force
  attacks.
- All API routes except `/api/auth/login` require a valid token.
- **Before real shop use**: change `AGRI_SHOP_JWT_SECRET` in
  `server/middleware/auth.js` (or set it as an environment variable) to a
  long random string, and change the default owner password.
- This server is designed for a closed local network (your shop WiFi/hotspot),
  not the open internet. Do not port-forward it to the public internet.

## Next stages

Reply with which module to build next (Stock, Menu/Ordering, Order Board,
Settlements/Collections, Reports, HR, Shop Settings, or WhatsApp backup) and
I'll continue building on this same foundation.

---

# Stage 2 — Full Build Complete

All remaining modules from the spec are now implemented on top of Stage 1:

- **Stock** (4): add/edit items with up to 6 sizes, addible stock, searchable
  item/category pickers with "Other" to register new ones, category filter,
  Get PDF.
- **Menu / Ordering** (5): home screen with search + category filter (chips
  on wide screens, dropdown on narrow ones), items with more sizes shown
  first, tap-to-add sizes, cart with +/- quantity, order submission with
  cash/loan logic and auto order numbering (`userId-0001`).
- **Order Board** (6): search, is_cash/kisan/zamindar/guarantor/category
  filters, settlement checkboxes (loan orders only, same kisan+guarantor
  enforced), cash watermark, settled/non-settled tags, print receipt, PDF.
- **Settlements & Payments** (7): settlement form from selected orders,
  auto payment numbering (`PA-userId-0001`), payments list incl. cash-order
  payments (with watermark), print receipt.
- **Collections** (8): collect selected payments (same receiver enforced),
  auto collection numbering (`Coll-userId-0001`), search/date filter, PDF.
- **Reports** (9): filter sales by order type, category, product, size, date
  range; revenue/quantity summary; PDF export.
- **HR** (10): owner-only employee register/edit/delete, per-employee salary
  & expense transaction log, "My Profile" view for non-owner roles.
- **Shop Settings** (11): shop name/address/branch, propagates everywhere
  via a shared context (drawer header, receipts, PDFs).
- **Security** (12): role checks now also enforced server-side — Settlement
  and Collection routes require `owner`; employee management, shop-name
  changes, and backups are further role-gated per section 16.
- **Guides** (13, 14): in-app Guides screen with the WiFi/Hotspot hosting
  guide, Termux testing guide, and security notes (mirrors this README).
- **Backup** (15): owner/manager can download the live database and share it
  through the system share sheet (pick WhatsApp there) from a Backup screen.
- **Role restrictions** (16): owner sees everything; manager loses
  Settlement/Payments and Collections from the drawer (and the server
  rejects those routes even if called directly); salesman/support staff
  additionally lose HR and Shop Settings, seeing "My Profile" instead.

## Fonts — action needed before running

The app expects font files at `app/assets/fonts/`:
`NotoSans-Regular.ttf`, `NotoSans-Medium.ttf`, `NotoSans-Bold.ttf`,
`NotoNastaliqUrdu-Regular.ttf`, `NotoNastaliqUrdu-Bold.ttf`.

Download them free from Google Fonts:
- https://fonts.google.com/noto/specimen/Noto+Sans
- https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu

Place the `.ttf` files in `app/assets/fonts/` using the exact names above.
Without them, the app falls back to the system font and logs a warning.

## Setting the API address without editing code

`app/src/api/client.js` defaults to `http://192.168.1.20:4000`. Until a
dedicated in-app field is added, change that default to your host device's
IP before building the APK, or edit it and reload during Expo Go testing.

## Known simplifications (flag these if they matter for your shop)

- Item photos: the Menu screen supports pictures if you add an `image_path`
  URL to an item, but there's no in-app photo upload yet — items without one
  show a text placeholder instead.
- Employee "salary" shown on the profile is the agreed salary figure, not a
  running balance of what's been paid — the transaction log (10d) is the
  source of truth for actual payments made.
- The default owner password (`owner123`) must be changed by editing the
  employee record from the HR screen (or the database) before real use.

---

# Stage 3 — Peer-to-Peer Hosting + Requested Refinements

This stage replaces the Express/HTTP server entirely with an **in-app
peer-to-peer host/client model**, and adds the eight refinements requested
on top of it.

## 1a. Hosting — no terminal, ever

- **Become Host**: any phone taps this once. It starts a real TCP server
  running inside the app itself (via `react-native-tcp-socket`), holding the
  shop's SQLite database. It shows an IP address, port, and a 6-character
  token.
- **Join as Client**: every other phone taps this, enters the Host's IP +
  token, and connects over WiFi, a phone hotspot, or Bluetooth tethering —
  anything that lets the phones reach each other's IP addresses.
- The token gates every connection before any data request is accepted.
  After that, each person still logs in with their own username/password.
- **Design choice, stated plainly**: rather than each device keeping an
  independent offline copy that gets merged later (multi-master
  replication), the Host holds the one live database and Clients are thin,
  always-connected front ends to it. For a shop ledger — order numbers,
  settlements, collections — a single source of truth avoids two phones
  handing out the same order number or settling the same loan twice while
  offline. The trade-off: a Client needs the Host reachable on the network
  to do anything. If you'd rather have true offline-first multi-device
  replication with conflict resolution, that's a materially larger, riskier
  rework for financial data — say so and it can be scoped separately.
- Every screen keeps working exactly as before; only the transport
  underneath changed. Live updates: any write from any device now nudges
  focused screens on every other device to refresh automatically.
- **Optional dedicated relay**: `server/` still exists for shops who'd
  rather run one always-on computer instead of a staff phone as Host. It
  speaks the exact same TCP protocol — phones don't know or care which kind
  of Host they're talking to. Run it with `node server.js <TOKEN> [port]`.
- **Build requirement**: because the app now runs its own TCP server and a
  real SQLite database in-process, it needs an EAS build (development or
  production), not Expo Go. This is a one-time step when you build the APK.

## 1b. Zamindar → Kisans list

Tapping "+ Add Kisan" on a Zamindar card now opens a list of that
Zamindar's Kisans as cards (with Edit), plus its own "+ Add Kisan" button,
instead of jumping straight to a blank form.

## 2. Stock history

New "History" button on the Stock screen shows every stock addition — item,
size, quantity added, price at the time, who added it, and when — filterable
by a date range and by search.

## 2b/2c. Item photos

Adding/editing a stock item now includes a photo picker. The photo is stored
as a base64 data-URI directly in the database (not a device file path), so
it syncs correctly to every phone regardless of which device the photo was
taken on. On the Menu screen, each size of an item shows that same photo,
scaled down progressively (first size largest, each next size smaller), so
the size difference is visually obvious at a glance.

## 3a. Filter reset buttons

Every filter dropdown now has an inline ✕ to clear just that filter.
Order Board also has a "Reset All Filters" button; Reports, Stock, Payments,
and Collections got matching clear/reset controls on their search and date
filters.

## 3b. Order receipt status

The printed order receipt now shows Payment Status (Cash vs Loan) and a
clearly colored Settlement Status pill (SETTLED / NOT SETTLED).

## 4. Payments screen — collect any non-collected payment

The selection checkbox in Payments now appears on every non-collected
payment, cash or loan — the only remaining rule is that everything selected
in one batch was received by the same person (unchanged, and still
enforced server-side).

## 5. Collection — shows who it was collected from

Both the Collection card and the printed Collection receipt now show
"Collected From (Employee)" — the salesman/employee whose cash-in-hand this
collection covers — alongside who collected it.

## 6. Employee cards + editable salary/expense records

Employee cards on the HR screen now show every field (username, contact,
education, address, salary, role) instead of just name and role. A new
"Salary & Expenses" screen per employee lets you record a salary payment
(amount, month, date — defaults to today) or an expense (amount,
description, date — defaults to today), and every past record has an Edit
button.

## 7. Shop Settings — logo + contact, shown everywhere

Shop Settings now includes a logo picker (stored as a data-URI, same
approach as item photos) and a contact number field. Both, along with the
shop name, now appear on: the drawer header, every printed receipt (order,
payment, collection), and every "Get PDF" export.

## What to test first

1. Build the APK via EAS (`eas build --profile development` is fastest to
   iterate with).
2. Install it on two phones. On phone A, tap Become Host. On phone B, tap
   Join as Client with phone A's IP/token.
3. Log in on both as the default owner (`owner` / `owner123`) — change this
   password immediately via the HR screen.
4. Create a Zamindar/Kisan/order on phone B and confirm it shows up on
   phone A within a moment (live refresh), and vice versa.

---

# Stage 4 — Standalone by Default, Compact Filters, and a Straight Answer on B

## A. No setup gate before login — Standalone is now the real default

The app used to ask "Become Host or Join as Client?" before you could even
log in. That's gone. Now:

- Opening the app for the first time goes **straight to Login** — no
  network screen at all.
- Every device runs its own local database from the moment it's installed
  and is **fully usable on its own** — Zamindars, Stock, Orders, everything
  — with zero setup, zero network, forever, if that's all you want.
- Hosting/joining is now a single **"Sync Settings"** entry in the drawer,
  reached only if and when you choose to look at it. From there:
  - **Become Host** — starts letting other phones connect to this one.
    This device's own data doesn't change or move; it just also starts
    listening.
  - **Join as Client** — connects this device to another phone's Host.
  - **Stop Hosting** / **Disconnect** — instantly drops back to Standalone.
    A device that stops hosting keeps every bit of its own data. A device
    that disconnects as a Client goes back to whatever it had locally
    before joining (empty, the first time).
- If a device was previously set up as Host or Client, that resumes quietly
  in the background on next launch — but it never blocks Login, and if a
  Client can't reach its Host right now, the app falls back to Standalone
  automatically rather than getting stuck.

## B. On not needing Termux / Expo Go / EAS — the honest technical answer

I want to be straight with you rather than paper over this: **genuine
phone-to-phone networking (the actual TCP server that lets one phone accept
connections from another over WiFi) is a native capability.** Expo Go is a
pre-built app Anthropic/Expo ships that only contains a fixed set of
features decided in advance — it cannot run new native code like a TCP
server, by design, for any app, from anyone. There's no configuration or
workaround inside this codebase that changes that; it's a wall built into
how Expo Go works.

What this means concretely, and where the "no Termux/Expo Go/EAS" promise
actually lands:

- **The shop staff who use this app never see any of those three tools.**
  They install one APK file (the same way they'd install any app) and open
  it. That was already true before this message, but I want to say it
  plainly: no phone that runs this app day-to-day ever needs Termux, Expo
  Go, or the EAS CLI installed on it.
- **Producing that one APK file does require a single native build,
  somewhere, once**, because of the TCP hosting and on-device SQLite
  database. This isn't a limitation I chose — it's the cost of "real
  peer-to-peer networking with no external server," which is what you
  asked for. There is no version of that feature that runs without a
  native build; if a build step of any kind is a hard no even once, the
  only way around it is dropping local peer-to-peer networking entirely in
  favor of syncing through an internet service (Firebase/Supabase or
  similar) — a materially different app that needs the internet to sync at
  all, even for two phones sitting next to each other. Say the word and
  that's a separate, doable rework — I don't want to silently swap
  architectures on you again without you choosing it.
- **That one build doesn't need Termux either.** Termux was only ever
  relevant to the very first version of this project (running a Node
  server by hand on a phone) — it dropped out of the picture two revisions
  ago and nothing today asks for it. If any earlier README text still
  implied otherwise, that's now stale; treat this section as current.
- The lowest-friction way to do that one-time build without installing
  anything locally: create a free account at expo.dev, connect this
  project's GitHub repo, and click "Build" on their website. Expo's
  servers do the compiling; you download a finished APK link at the end.
  No terminal, no local Android tooling — just a browser and a GitHub
  account. Alternatively, `npx eas build` from any computer with Node
  installed works too, if that's easier for you.

## C. Smaller filter areas

Order Board and Reports had filter panels tall enough to push the results
list off-screen. Both now use a compact "Filters" button that opens the
same filters in a bottom-sheet overlay instead of inline — the results list
underneath now uses almost the full screen at all times. The button shows a
small green dot when a filter is active, so you can tell at a glance
without opening it. Stock, Payments, and Collections already had small,
single-row filter bars and were left as-is.

---

# Stage 5 — Licensing, Order Board Rework, Order Editing

## 1. Licensing via Google Sheets

The app now requires a license key before it can be used, checked against a
Google Sheet you control. Full setup guide: **`/licensing/README.md`** at
the project root; the Apps Script code to paste in is **`/licensing/AppsScript.gs`**.

Short version: a device enters a key once, the app asks your Google Sheet
"is this valid?", and stays unlocked for up to 5 days offline before
quietly re-checking. Revoke or expire a customer by editing one cell in the
Sheet — no app update needed. One key is meant to cover one shop (every
staff phone at that shop enters the same key), not one device.

Before this works you must deploy the Apps Script and paste the resulting
URL into `app/src/license/licenseConfig.js` — the app will show a clear
error on the license screen if that step hasn't been done yet.

Owners can see license status (and switch to a different key) from
**License** in the drawer.

## 2. Order Board — filters simplified and a real bug fixed

**The bug**: filters were sometimes applying the *previous* filter's value
instead of the one you'd just tapped. Cause: the code called `setFilter(x)`
immediately followed by `load()` in the same tap — but React doesn't apply
`setFilter` until the next render, so `load()` was still reading the old
value. Every filter now passes its new value directly into `load()` instead
of relying on state that hasn't committed yet, which removes the bug
entirely (this pattern is also used everywhere else filters exist).

**2. Simplified filters**: the gear icon and its modal (which had Kisan,
Zamindar, Guarantor, Category) are gone. Order Board now has exactly two
filters, as small buttons directly under the search field: **is_cash** (All
/ Cash / Loan) and **Kisan** (an "All Kisan" button plus a compact
dropdown).

**2b. Totals row**: directly under the filter buttons, two figures — total
Settled and total Not Settled — computed from whatever the current search
and filters are showing.

**2c. Selection clears itself**: ticking orders for settlement and
completing (or navigating away from) that flow now clears the selection
automatically, so you don't come back to old orders still checked.

**2d. Selected total**: the "Receive" bar at the bottom now shows the sum of
the currently selected orders' amounts, not just a count.

## 3. Grand total on the Orders PDF

"Get PDF" on Order Board now prints a Grand Total line under the table,
summing whatever's currently filtered/visible.

## 4. Orders are editable for 10 minutes

Order cards show an **Edit** button for 10 minutes after creation, as long
as the order isn't already settled — both enforced on the server (not just
hidden in the UI) so it can't be bypassed. Editing lets you adjust
quantities on the items already in the order (+/− controls) and change the
receiver/Kisan/Guarantor. Stock is correctly reversed and reapplied to
match the new quantities, and if it's a cash order, its linked payment
record is kept in sync with the new total automatically.

**Scope note**: adding a brand-new item to an order that didn't originally
have it isn't supported in this edit screen yet — only quantities of items
already on the order can change. If that's needed often, it's a
straightforward follow-up (reusing the Menu's item picker inside the edit
screen) — flag it and it can be added.

---

# Stage 6 — Payments Filter Bugs

Two real bugs, now fixed, both stemming from the same root causes as the
Order Board filter bug in Stage 5:

1. **Payments filters gave mismatched results.** Payments had no visible
   filter buttons at all — only search. Added the same compact filter chips
   as Order Board: **is_cash** (All/Cash/Loan) and **Collected** (All/
   Collected/Not Collected), using the same explicit-value pattern so they
   can't go stale.

2. **"Unselect all" still showed a stale count.** If a payment you had
   selected got collected — by you, or by another device while you were
   looking at the screen — its checkbox correctly disappeared, but the
   selection count in the bottom bar didn't update to match, because
   nothing had told the `selected` state that payment was gone. Every time
   the list reloads now (manually, via a filter, or via a live update from
   another device), the current selection is re-checked against the fresh
   data and anything no longer selectable (collected, or filtered out) is
   dropped automatically. Applied the same fix to Order Board for the same
   class of bug there.

3. **Selection now starts empty and clears after use, everywhere this
   pattern exists** (Payments and Order Board): opening either screen
   always starts with nothing selected, and completing the action you
   selected for (collecting payments, receiving/settling orders) clears the
   selection immediately rather than leaving stale ticks behind.

Also fixed a smaller efficiency bug in `useAutoRefresh` (the hook behind
live updates from other devices): several screens passed it a brand-new
inline function on every render, which caused it to silently unsubscribe
and resubscribe from live updates constantly instead of once per screen
visit. It now holds the latest function in a ref internally, so this can't
happen regardless of how a screen calls it.






---

# Stage 7 — Login Crash Fix + Bypass Button

## 1. Fixed: bcrypt error on login

There were actually **two layered issues** here, and the first fix in this
file's history only addressed one of them — worth explaining both since the
second one produced a more confusing error ("Requiring unknown module
'undefined'").

- **Issue A**: `bcryptjs` needs a source of secure random bytes. Hermes
  (React Native's JS engine) doesn't provide the Web Crypto API a browser
  would. Fixed by adding `react-native-get-random-values` and importing it
  as the literal first line of `App.js`.
- **Issue B (the one that actually crashed the app)**: before bcryptjs even
  gets to the point of needing that Web Crypto fallback, its *very first*
  attempt is a literal `require("crypto")` — Node's real crypto module.
  Metro (the bundler) can't resolve that, and fails in a way bcryptjs's own
  try/catch doesn't cleanly swallow, producing exactly the "Requiring
  unknown module 'undefined'" crash you saw. Fixed with a `metro.config.js`
  that points Metro's resolver at a tiny local shim (`shims/crypto.js`)
  whenever anything asks for `"crypto"` — so that first `require` attempt
  just succeeds, using the same random-values polyfill from Issue A
  underneath it.

Both pieces are needed together; either alone still crashes. You'll need to
run `npm install` (to pull in `react-native-get-random-values`) and do a
fresh EAS build for this to take effect — Metro config changes and new
native dependencies both require a rebuild, not just a reload.

## 2. License bypass (7 taps)

On the License screen, tapping the "Agri Shop" title 7 times within 3
seconds activates a local bypass — no server check, works immediately,
persists across restarts. It's clearly labeled everywhere it shows up
("Bypass Mode (not a real license)") so it's never mistaken for a real
license, and there's a **Remove Bypass** button on the License screen in
the drawer for whenever you want to switch back to requiring a real key.

---

# Stage 8 — The Real Fix for the Login Crash

Your follow-up error ("Requiring unknown module 'undefined'", pointing at
`bcrypt.js:70` inside `random()`) confirmed the random-values polyfill
alone wasn't enough — see the corrected Stage 7 section above for the full
two-part explanation. The fix is now:

1. `app/shims/crypto.js` — a minimal shim providing `randomBytes(len)`,
   backed by the polyfill from Stage 7.
2. `app/metro.config.js` — tells Metro to hand that shim to anything that
   `require("crypto")`, instead of failing to resolve it.

**Action needed**: `npm install` in `app/`, then a fresh EAS build. This
can't be fixed by reloading the existing build — both a new dependency and
a bundler config change require a real rebuild to take effect.

---

# Stage 9 — Desktop App (Electron), Order Board Date/Settled Filters, Urdu PDFs

## Desktop app

Full functionality now also runs as a real Windows/Mac/Linux desktop app —
see **`/desktop/README.md`**. It reuses the exact same tested backend logic
as the mobile app and the Node relay (identical handler files), and reuses
the mobile UI screens via React Native Web, so all modules work the same
way. Data model is identical too: Standalone by default, optional Become
Host / Join as Client from Sync Settings in the sidebar — and phones and
desktop computers can share the same data, since they speak the same
networking protocol.

Two new top-level guides, as requested:
- **`/TERMUX_GUIDE.md`** — zero to pro. Honest up front: Electron's actual
  window can't open inside Termux (no Android build of Electron exists,
  same as for any Electron app) — but every bit of business logic behind
  the screens is plain Node.js and genuinely testable there, and the guide
  shows exactly how.
- **`/BUILD_EXE_GUIDE.md`** — turns the desktop app into a real `.exe`
  (plus Mac/Linux builds) using GitHub's free cloud build servers. No
  local Node/Electron install needed — a browser and a free GitHub account
  is enough. A ready-to-use workflow file is already included at
  `.github/workflows/build.yml`.

## 1. Order Board: date range + settled/non-settled filters

Added alongside the existing is_cash and Kisan filters, using the same
explicit-value pattern so they can't go stale. A "✕ Reset" button clears
all Order Board filters at once when any are active.

## 2. PDFs and receipts follow the app's current language

Every printed receipt and "Get PDF" export now renders in whichever
language the app is currently set to — Urdu labels, right-to-left layout,
and an Urdu-appropriate font when the app is in Urdu; English labels and
left-to-right layout when it's in English. On the desktop app specifically,
the Urdu font is embedded directly into the generated PDF/print output
(rather than relying on the computer already having it installed), so it
renders correctly everywhere.

## Honesty check on this stage

This was the largest single change yet — a full second front-end (desktop)
sharing a backend with two existing ones (mobile, relay). I've syntax-
checked every file, but I have no way to actually run `npm install` or open
the Electron window in the environment I worked in (no internet, no
display). The architecture directly reuses code that's already been tested
in the mobile app, which gives me real confidence in the backend half; the
renderer half (React Native Web rendering the mobile screens inside
Electron) is the part I'd most want you to stress-test first — please run
`npm run dev` in `/desktop` early and tell me anything that doesn't come up
looking right, rather than assuming it's polished.
