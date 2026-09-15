// shims/crypto.js
//
// bcryptjs's very first attempt at getting random bytes is a literal
// `require("crypto")` call, guarded only by `typeof module !== 'undefined'`
// — which is true in Metro's bundle environment too, so it always takes
// this branch first, before ever considering the WebCryptoAPI fallback.
// Metro can't resolve the real Node "crypto" module and fails in a way
// bcryptjs's own try/catch doesn't cleanly catch ("Requiring unknown
// module 'undefined'"), crashing the app instead of falling through.
//
// Fix: give Metro something to resolve "crypto" TO (see metro.config.js),
// namely this file, so bcryptjs's first attempt just succeeds. It's backed
// by react-native-get-random-values' crypto.getRandomValues polyfill,
// which App.js installs before anything else runs.

function randomBytes(len) {
  const arr = new Uint8Array(len);
  global.crypto.getRandomValues(arr);
  return arr;
}

module.exports = { randomBytes };
