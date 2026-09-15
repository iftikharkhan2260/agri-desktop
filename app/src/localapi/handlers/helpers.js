function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function requireAuth(user) {
  if (!user) throw httpError(401, 'Not authenticated.');
  return user;
}

function requireRole(user, ...roles) {
  requireAuth(user);
  if (!roles.includes(user.role)) throw httpError(403, 'You do not have permission to do this.');
  return user;
}

module.exports = { httpError, requireAuth, requireRole };
