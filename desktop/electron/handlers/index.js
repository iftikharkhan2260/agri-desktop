const { createRouter } = require('../router');
const auth = require('./auth');
const zamindars = require('./zamindars');
const guarantors = require('./guarantors');
const kisans = require('./kisans');
const categories = require('./categories');
const items = require('./items');
const orders = require('./orders');
const payments = require('./payments');
const collections = require('./collections');
const reports = require('./reports');
const hr = require('./hr');
const settings = require('./settings');

function buildRouter(db) {
  const router = createRouter(db);

  router.add('POST', '/api/auth/login', auth.login);
  router.add('GET', '/api/auth/me', auth.me);

  router.add('GET', '/api/zamindars', zamindars.list);
  router.add('POST', '/api/zamindars', zamindars.create);
  router.add('PUT', '/api/zamindars/:id', zamindars.update);
  router.add('DELETE', '/api/zamindars/:id', zamindars.remove);

  router.add('GET', '/api/guarantors', guarantors.list);
  router.add('POST', '/api/guarantors', guarantors.create);
  router.add('PUT', '/api/guarantors/:id', guarantors.update);
  router.add('DELETE', '/api/guarantors/:id', guarantors.remove);

  router.add('GET', '/api/kisans', kisans.list);
  router.add('POST', '/api/kisans', kisans.create);
  router.add('PUT', '/api/kisans/:id', kisans.update);
  router.add('DELETE', '/api/kisans/:id', kisans.remove);

  router.add('GET', '/api/categories', categories.list);
  router.add('POST', '/api/categories', categories.create);

  router.add('GET', '/api/items', items.list);
  router.add('GET', '/api/items/stock-history', items.stockHistory); // must be before /:id
  router.add('GET', '/api/items/:id', items.get);
  router.add('POST', '/api/items', items.create);
  router.add('PUT', '/api/items/:id', items.update);
  router.add('DELETE', '/api/items/:id', items.remove);
  router.add('DELETE', '/api/items/:itemId/sizes/:sizeId', items.removeSize);

  router.add('GET', '/api/orders', orders.list);
  router.add('GET', '/api/orders/:id', orders.get);
  router.add('POST', '/api/orders', orders.create);
  router.add('PUT', '/api/orders/:id', orders.update);

  router.add('GET', '/api/payments', payments.list);
  router.add('POST', '/api/payments', payments.create);

  router.add('GET', '/api/collections', collections.list);
  router.add('GET', '/api/collections/pending-payments', collections.pendingPayments);
  router.add('POST', '/api/collections', collections.create);

  router.add('GET', '/api/reports/sales', reports.sales);

  router.add('GET', '/api/hr/employees', hr.listEmployees);
  router.add('GET', '/api/hr/employees/me', hr.me);
  router.add('POST', '/api/hr/employees', hr.createEmployee);
  router.add('PUT', '/api/hr/employees/:id', hr.updateEmployee);
  router.add('DELETE', '/api/hr/employees/:id', hr.deleteEmployee);
  router.add('GET', '/api/hr/transactions', hr.listTransactions);
  router.add('POST', '/api/hr/transactions', hr.createTransaction);
  router.add('PUT', '/api/hr/transactions/:id', hr.updateTransaction);

  router.add('GET', '/api/settings', settings.get);
  router.add('PUT', '/api/settings', settings.update);

  return router;
}

module.exports = { buildRouter };
