# Termux Guide — Zero to Pro

**Read this first, honestly:** Electron apps open a real desktop window
(Windows/Mac/Linux). Termux runs on Android, which has no desktop display
server Electron can draw into — so **the actual Agri Shop window cannot be
opened inside Termux**, on any phone, no matter how this is configured.
That's not a limitation of this project; it's true of every Electron app
for everyone.

What Termux **is** genuinely useful for: the entire business logic behind
every screen — Zamindars, Stock, Orders, Payments, everything — lives in
plain Node.js files (`desktop/electron/handlers/`) with zero Electron-only
code in them. You can run and test all of that logic for real inside
Termux, using nothing but Node.js and a terminal. This guide takes you from
a bare phone to confidently testing that logic, step by step.

---

## Part 1 — Zero: installing Termux and Node

1. Install **Termux** from F-Droid (recommended over the Play Store version,
   which is outdated): https://f-droid.org/packages/com.termux/
2. Open Termux and run:
   ```bash
   pkg update && pkg upgrade
   pkg install nodejs-lts git python make clang
   ```
   (`python make clang` are needed to compile `better-sqlite3`'s native
   code — this is normal and only needed once.)
3. Confirm it worked:
   ```bash
   node -v
   npm -v
   ```

## Part 2 — Getting the project onto your phone

Option A — copy the folder directly:
```bash
termux-setup-storage
# then copy the "agri-shop" folder into ~/storage/shared/, and:
cp -r ~/storage/shared/agri-shop ~/agri-shop
cd ~/agri-shop/desktop
```

Option B — if you've pushed the project to GitHub:
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>/desktop
```

## Part 3 — Installing just the backend pieces

You don't need Electron or Vite for logic testing — just the Node parts:

```bash
npm install better-sqlite3
```

If `better-sqlite3` fails to compile, it's almost always one of the
`pkg install` packages from Part 1 missing — re-run that line and try again.

## Part 4 — Your first test: logging in as the default owner

Create a file `test-login.js` in the `desktop` folder:

```js
// test-login.js — a minimal harness that exercises the exact same
// handler code the real app uses, with no Electron involved.
require.cache[require.resolve('electron')] = {
  exports: { app: { getPath: () => __dirname } }
};

const db = require('./electron/dbAdapter');
const { buildRouter } = require('./electron/handlers');

async function main() {
  await db.ready();
  const router = buildRouter(db);

  const login = await router.handleRequest({
    method: 'POST',
    path: '/api/auth/login',
    body: { username: 'owner', password: 'owner123' }
  });
  console.log('Login result:', login);

  const zamindars = await router.handleRequest({
    method: 'GET',
    path: '/api/zamindars',
    query: {},
    user: login.user
  });
  console.log('Zamindars:', zamindars);
}

main().catch((err) => console.error('FAILED:', err));
```

Since `require('electron')` won't resolve in plain Node, add a tiny stub
package first:
```bash
mkdir -p node_modules/electron
echo "module.exports = { app: { getPath: () => __dirname } };" > node_modules/electron/index.js
```

Then run:
```bash
node test-login.js
```

You should see the owner user logged in and an (empty, at first) list of
Zamindars — proof the real hashing, database, and business logic all work
correctly on your phone.

## Part 5 — Pro: exercising every feature from the command line

Once Part 4 works, you can call **any** route the same way — every handler
in `electron/handlers/` maps directly to the same paths the real app calls
(see `electron/handlers/index.js` for the full list). For example, to
create a Zamindar:

```js
const created = await router.handleRequest({
  method: 'POST',
  path: '/api/zamindars',
  body: { name: 'Ahmad Traders', contact: '0300-1234567', address: 'Main Bazaar' },
  user: login.user
});
console.log(created);
```

This is genuinely the same code path the desktop app's UI triggers when you
click "Submit" on the Zamindar form — nothing is faked or simplified for
this test harness. If it works here, the underlying logic works; only the
window itself needs a real desktop OS to actually see.

## Part 6 — Testing the optional TCP hosting from Termux

Because `desktop/electron/netHost.js` and `netClient.js` use Node's plain
`net` module (no Electron-specific APIs), you genuinely *can* run a real
Host from Termux — useful as a lightweight always-on relay on an old
Android phone, even without ever opening a desktop window on it:

```bash
node -e "
require.cache[require.resolve('electron')] = { exports: { app: { getPath: () => __dirname } } };
const netHost = require('./electron/netHost');
netHost.start('MYTOKEN123', 4050).then(({port}) => console.log('Hosting on port', port));
"
```

Leave that running, then connect the real desktop app or the mobile app to
this phone's IP and token as a Client — this is a legitimate way to use an
old Android phone as your shop's always-on host device.

## Where to go from here

Everything above proves the logic. To see and use the actual application
window, install Node.js and this project on a real Windows, Mac, or Linux
computer and follow the main `README.md`, or use `BUILD_EXE_GUIDE.md` to
get a ready-to-run `.exe` without installing anything yourself.
