// metro.config.js
//
// bcryptjs (used for all password hashing) calls require("crypto") as its
// first attempt at getting random bytes. Metro has no such module and, in
// this Expo SDK 51 setup, fails that require in a way bcryptjs's own
// try/catch doesn't cleanly swallow — crashing the app on first login
// attempt with "Requiring unknown module 'undefined'".
//
// Fix: point Metro's resolver at a tiny local shim (see shims/crypto.js)
// whenever anything asks for "crypto", so the require succeeds instead of
// failing. This is the standard fix for bcryptjs (and similar libraries)
// under Metro/Hermes.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  crypto: path.resolve(__dirname, 'shims/crypto.js')
};

module.exports = config;
