// router.js — identical copy lives in server/handlers/router.js.
// Matches {method, path} against a route table, extracts :params, and calls
// the matching handler with (db, { params, query, body, user }).
// All requests are serialized through one queue so two near-simultaneous
// writes (e.g. two phones submitting an order at once) can never interleave
// and corrupt a transaction or hand out the same order number twice.

function compilePattern(pattern) {
  const paramNames = [];
  const regexStr = pattern
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        paramNames.push(seg.slice(1));
        return '([^/]+)';
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

function createRouter(db) {
  const routes = []; // { method, ...compilePattern, handler }

  function add(method, pattern, handler) {
    routes.push({ method, handler, ...compilePattern(pattern) });
  }

  let queue = Promise.resolve();
  function serialize(fn) {
    const result = queue.then(fn, fn);
    queue = result.then(() => {}, () => {});
    return result;
  }

  async function dispatch({ method, path, query = {}, body = {}, user = null }) {
    const cleanPath = path.split('?')[0];
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = cleanPath.match(route.regex);
      if (!match) continue;
      const params = {};
      route.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
      return route.handler(db, { params, query, body, user });
    }
    const err = new Error(`No route for ${method} ${cleanPath}`);
    err.status = 404;
    throw err;
  }

  function handleRequest(req) {
    // Reads are allowed to run without waiting behind the write queue;
    // writes are serialized so numbering/transactions stay correct.
    if (req.method === 'GET') return dispatch(req);
    return serialize(() => dispatch(req));
  }

  return { add, handleRequest };
}

module.exports = { createRouter };
