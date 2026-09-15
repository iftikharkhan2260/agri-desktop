// protocol.js — identical copy lives in app/src/net/protocol.js.
// Newline-delimited JSON (NDJSON) framing over a plain TCP socket.
// Message shapes:
//   Client -> Host (first message):  { type: 'auth', token }
//   Host -> Client:                  { type: 'auth_ok' } | { type: 'auth_fail' }
//   Client -> Host:                  { type: 'request', id, method, path, query, body }
//   Host -> Client:                  { type: 'response', id, status, data } | { type:'response', id, status, error }
//   Host -> Client (broadcast):      { type: 'event', event: 'changed', resource }

const DEFAULT_PORT = 4050;

function encode(message) {
  return JSON.stringify(message) + '\n';
}

// Feed raw incoming bytes into this to get back an array of parsed messages,
// keeping any partial trailing line in `state.buffer` for the next chunk.
function makeFrameParser(onMessage) {
  let buffer = '';
  return function feed(chunk) {
    buffer += chunk.toString('utf8');
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (!line.trim()) continue;
      try {
        onMessage(JSON.parse(line));
      } catch (err) {
        // Ignore malformed lines rather than crashing the connection.
      }
    }
  };
}

module.exports = { DEFAULT_PORT, encode, makeFrameParser };
