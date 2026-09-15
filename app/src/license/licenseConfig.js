// licenseConfig.js
//
// After you deploy the Google Apps Script (see /licensing/README.md at the
// project root and /licensing/AppsScript.gs for the code to paste), put the
// Web App URL it gives you here. Every installed copy of the app checks
// license keys against this one URL.

export const LICENSE_API_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

// After a successful check, a device can keep working offline for this many
// days before it's required to reach the license server again. Keeps the
// app usable without internet day-to-day while still enforcing licensing
// regularly. Set to 0 to require a check every single launch (not
// recommended — a shop with no signal that day would be locked out).
export const GRACE_PERIOD_DAYS = 5;
