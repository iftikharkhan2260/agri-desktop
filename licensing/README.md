# Licensing — controlled from a Google Sheet

This lets you (the app owner) turn any installed copy on or off, or set an
expiry date, just by editing a spreadsheet — no app update needed.

## How it works

- Every device that runs the app must enter a **license key** once.
- The app asks a small Google Apps Script (attached to your Sheet) "is this
  key valid?" The script looks the key up in your Sheet and answers yes/no.
- Once confirmed, a device stays unlocked for up to `GRACE_PERIOD_DAYS`
  (5 by default) without needing internet again, then it quietly re-checks.
  If you've revoked or expired that key by then, the device locks on its
  next check.
- One license key is meant to cover **one shop**, not one device — the
  owner's phone and every staff phone at that shop all enter the same key.
  If you want to sell separate licenses to separate shops, give each shop
  its own key (its own row in the Sheet).

## Setup (about 10 minutes, once)

1. Create a new Google Sheet.
2. Rename the first tab to **Licenses**.
3. In row 1, add these exact column headers:
   `LicenseKey | ShopName | Status | ExpiryDate`
4. Add one row per customer, e.g.:
   `AGRI-AHMAD-01 | Ahmad Traders | Active | 2027-01-01`
   - `Status` must be exactly `Active` to work — anything else blocks it.
   - `ExpiryDate` can be blank for a license that never expires.
5. In the Sheet, go to **Extensions > Apps Script**. Delete whatever
   placeholder code is there and paste in the contents of `AppsScript.gs`
   (in this same folder). Save.
6. Click **Deploy > New deployment**. Choose type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click Deploy, approve the permissions prompt, and copy the **Web app
   URL** it gives you (it ends in `/exec`).
7. Open `app/src/license/licenseConfig.js` and paste that URL in as
   `LICENSE_API_URL`.
8. Rebuild the app (see the main README for the EAS build steps). Every
   installed copy now checks against your Sheet.

## Day to day

- **New customer**: add a row with a new `LicenseKey`, give them that key.
- **Stop a customer's access**: change their `Status` cell to anything
  other than `Active` (e.g. `Revoked`). Takes effect within their grace
  period automatically — no need to contact them or push an update.
- **Renew**: update their `ExpiryDate` cell.
- **See who's checking in**: a second tab called `ActivityLog` is created
  automatically the first time anyone checks a key — it logs every check
  with a timestamp, which key, and the shop name, so you can see usage.

## Notes

- This does not require a paid Google account — a free Gmail account and
  free Google Sheets/Apps Script are enough.
- The Web App URL is not secret-key-protected beyond "you have to know the
  URL" — that's normal for this kind of lightweight license check and fine
  for this use case, but don't publish the URL somewhere public.
- If you'd rather not depend on Google at all, the same
  `app/src/license/licenseService.js` file can be pointed at any other
  HTTPS endpoint that returns `{ valid, message, shopName, expiry }` JSON —
  ask if you'd like that swapped for something else later.
