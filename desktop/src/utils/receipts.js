// receipts.js — item 2: every receipt/PDF now renders in whichever
// language the app's UI is currently set to (English or Urdu), not just
// English. Pass the current lang (from useLang()) into every function here.

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const RECEIPT_STRINGS = {
  en: {
    orderReceipt: 'Order Receipt', paymentReceipt: 'Payment Receipt', collectionReceipt: 'Collection Receipt',
    salesman: 'Salesman', receiver: 'Receiver', kisan: 'Kisan', zamindar: 'Zamindar', guarantor: 'Guarantor',
    paymentStatus: 'Payment Status', settlementStatus: 'Settlement Status',
    cashPaid: 'Cash (paid at sale)', loanCredit: 'Loan (on credit)',
    settled: 'SETTLED', notSettled: 'NOT SETTLED',
    item: 'Item', qty: 'Qty', price: 'Price', total: 'Total',
    date: 'Date', receivedFrom: 'Received From', receivedBy: 'Received By', orderNo: 'Order #', amount: 'Amount',
    collectedFrom: 'Collected From (Employee)', collectedBy: 'Collected By', paymentId: 'Payment ID',
    cashOrder: '✓ CASH ORDER'
  },
  ur: {
    orderReceipt: 'آرڈر رسید', paymentReceipt: 'ادائیگی کی رسید', collectionReceipt: 'وصولی کی رسید',
    salesman: 'سیلز مین', receiver: 'وصول کنندہ', kisan: 'کسان', zamindar: 'زمیندار', guarantor: 'ضامن',
    paymentStatus: 'ادائیگی کی حالت', settlementStatus: 'تصفیہ کی حالت',
    cashPaid: 'نقد (فروخت کے وقت ادا)', loanCredit: 'قرض (ادھار)',
    settled: 'طے شدہ', notSettled: 'غیر طے شدہ',
    item: 'آئٹم', qty: 'مقدار', price: 'قیمت', total: 'کل رقم',
    date: 'تاریخ', receivedFrom: 'سے وصول کیا', receivedBy: 'وصول کنندہ', orderNo: 'آرڈر نمبر', amount: 'رقم',
    collectedFrom: 'سے جمع کیا (ملازم)', collectedBy: 'جمع کرنے والا', paymentId: 'ادائیگی نمبر',
    cashOrder: '✓ نقد آرڈر'
  }
};

function t(lang, key) {
  return (RECEIPT_STRINGS[lang] || RECEIPT_STRINGS.en)[key] || RECEIPT_STRINGS.en[key] || key;
}

// Section 7: shop name, logo, and contact number are shown on every printed
// receipt, sourced from Shop Settings so a change there updates them all.
function wrap(settings, title, body, lang) {
  const shopName = settings?.shop_name || 'Agri Shop';
  const contact = settings?.contact;
  const logo = settings?.logo_path;
  const isRTL = lang === 'ur';
  const dir = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  // Urdu font stack relies on the device's/OS's installed Urdu-capable
  // fonts (e.g. Noto Nastaliq Urdu) — see README for how the desktop build
  // embeds the bundled font file directly for guaranteed rendering there.
  const fontFamily = isRTL
    ? "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', Tahoma, Arial, sans-serif"
    : "'Noto Sans', Helvetica, Arial, sans-serif";

  return `
  <html dir="${dir}"><head><meta charset="utf-8" /><style>
    body { font-family: ${fontFamily}; padding: 24px; color: #101828; direction: ${dir}; text-align: ${align}; }
    .shop-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
    .shop-header img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    h1 { color: #123C69; margin: 0; }
    .contact { color: #5B6B82; font-size: 12px; margin: 2px 0 0; }
    h2 { color: #5B6B82; font-weight: normal; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #D6DEE8; font-size: 13px; }
    .label { color: #5B6B82; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #123C69; color: #fff; text-align: ${align}; padding: 6px; font-size: 12px; }
    td { border-bottom: 1px solid #D6DEE8; padding: 6px; font-size: 12px; }
    .total { font-size: 18px; font-weight: bold; color: #1B7A43; text-align: ${isRTL ? 'left' : 'right'}; margin-top: 16px; }
    .watermark { color: #1B7A43; font-size: 22px; font-weight: bold; text-align: center; border: 3px solid #1B7A43;
                 display: inline-block; padding: 6px 16px; margin-top: 12px; }
    .status-pill { display: inline-block; border-radius: 12px; padding: 3px 10px; font-size: 11px; font-weight: bold; color: #fff; margin-right: 6px; }
    .status-settled { background: #1B7A43; }
    .status-unsettled { background: #B3261E; }
  </style></head><body>
    <div class="shop-header">
      ${logo ? `<img src="${logo}" />` : ''}
      <div>
        <h1>${escapeHtml(shopName)}</h1>
        ${contact ? `<p class="contact">${escapeHtml(contact)}</p>` : ''}
      </div>
    </div>
    <h2>${escapeHtml(title)}</h2>
    ${body}
  </body></html>`;
}

// Section 3b: payment status and settlement status shown on the order receipt.
export function orderReceiptHtml(order, settings, lang = 'en') {
  const rows = (order.items || []).map((it) => `
    <tr><td>${escapeHtml(it.item_name)} (${escapeHtml(it.size_label)})</td>
        <td>${it.quantity}</td><td>${it.unit_price}</td><td>${(it.quantity * it.unit_price).toFixed(2)}</td></tr>
  `).join('');

  const paymentStatus = order.is_cash ? t(lang, 'cashPaid') : t(lang, 'loanCredit');
  const settled = order.is_cash ? true : !!order.settled;

  return wrap(settings, `${t(lang, 'orderReceipt')} — ${order.order_number}`, `
    <div class="row"><span class="label">${t(lang, 'salesman')}</span><span>${escapeHtml(order.salesman_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'receiver')}</span><span>${escapeHtml(order.receiver_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'kisan')}</span><span>${escapeHtml(order.kisan_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'zamindar')}</span><span>${escapeHtml(order.zamindar_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'guarantor')}</span><span>${escapeHtml(order.guarantor_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'paymentStatus')}</span><span>${escapeHtml(paymentStatus)}</span></div>
    <div class="row"><span class="label">${t(lang, 'settlementStatus')}</span>
      <span class="status-pill ${settled ? 'status-settled' : 'status-unsettled'}">${settled ? t(lang, 'settled') : t(lang, 'notSettled')}</span>
    </div>
    <table><thead><tr><th>${t(lang, 'item')}</th><th>${t(lang, 'qty')}</th><th>${t(lang, 'price')}</th><th>${t(lang, 'total')}</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">${t(lang, 'total')}: ${order.total_amount.toFixed(2)}</div>
    ${order.is_cash ? `<div style="text-align:center"><div class="watermark">${t(lang, 'cashOrder')}</div></div>` : ''}
  `, lang);
}

export function paymentReceiptHtml(payment, settings, lang = 'en') {
  const rows = (payment.orders || []).map((o) => `
    <tr><td>${escapeHtml(o.order_number)}</td><td>${o.amount.toFixed(2)}</td></tr>
  `).join('');

  return wrap(settings, `${t(lang, 'paymentReceipt')} — ${payment.payment_no}`, `
    <div class="row"><span class="label">${t(lang, 'date')}</span><span>${escapeHtml(payment.created_at)}</span></div>
    <div class="row"><span class="label">${t(lang, 'receivedFrom')}</span><span>${escapeHtml(payment.received_from)}</span></div>
    <div class="row"><span class="label">${t(lang, 'receivedBy')}</span><span>${escapeHtml(payment.received_by_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'guarantor')}</span><span>${escapeHtml(payment.guarantor_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'kisan')}</span><span>${escapeHtml(payment.kisan_name)}</span></div>
    <table><thead><tr><th>${t(lang, 'orderNo')}</th><th>${t(lang, 'amount')}</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">${t(lang, 'total')}: ${payment.total_amount.toFixed(2)}</div>
    ${payment.is_cash ? `<div style="text-align:center"><div class="watermark">${t(lang, 'cashOrder')}</div></div>` : ''}
  `, lang);
}

// Section 5: shows which employee this collection was collected from.
export function collectionReceiptHtml(collection, settings, lang = 'en') {
  const rows = (collection.payments || []).map((p) => `
    <tr><td>${escapeHtml(p.payment_no)}</td><td>${p.amount.toFixed(2)}</td></tr>
  `).join('');

  return wrap(settings, `${t(lang, 'collectionReceipt')} — ${collection.collection_id}`, `
    <div class="row"><span class="label">${t(lang, 'date')}</span><span>${escapeHtml(collection.created_at)}</span></div>
    <div class="row"><span class="label">${t(lang, 'collectedFrom')}</span><span>${escapeHtml(collection.collected_from_name)}</span></div>
    <div class="row"><span class="label">${t(lang, 'collectedBy')}</span><span>${escapeHtml(collection.collected_by_name)}</span></div>
    <table><thead><tr><th>${t(lang, 'paymentId')}</th><th>${t(lang, 'amount')}</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">${t(lang, 'total')}: ${collection.total_amount.toFixed(2)}</div>
  `, lang);
}
