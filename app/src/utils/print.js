import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Builds a simple, print-friendly HTML table. Used by every "Get PDF" button
// (Stock, Order Board, Payments Collected, Reports) so filtered on-screen data
// becomes a shareable PDF. `settings` is the Shop Settings object (section 7)
// so the shop name/logo/contact shown here always matches what's configured.
// `lang` (item 2) makes the PDF follow the current UI language for layout
// direction and font; pass already-translated `title`/column `label`s.
export function buildTableHtml({ title, columns, rows, settings, footerHtml, lang = 'en' }) {
  const shopName = settings?.shop_name || 'Agri Shop';
  const contact = settings?.contact;
  const logo = settings?.logo_path;
  const isRTL = lang === 'ur';
  const dir = isRTL ? 'rtl' : 'ltr';
  const align = isRTL ? 'right' : 'left';
  const fontFamily = isRTL
    ? "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', Tahoma, Arial, sans-serif"
    : "'Noto Sans', Helvetica, Arial, sans-serif";

  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = rows.map((row) => {
    const cells = columns.map((c) => `<td>${escapeHtml(String(row[c.key] ?? ''))}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
  <html dir="${dir}">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: ${fontFamily}; padding: 24px; color: #101828; direction: ${dir}; text-align: ${align}; }
        .shop-header { display: flex; align-items: center; gap: 12px; margin-bottom: 2px; flex-direction: ${isRTL ? 'row-reverse' : 'row'}; }
        .shop-header img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
        h1 { color: #123C69; font-size: 20px; margin: 0; }
        .contact { color: #5B6B82; font-size: 11px; margin: 2px 0 0; }
        h2 { color: #5B6B82; font-size: 13px; font-weight: normal; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #123C69; color: #fff; text-align: ${align}; padding: 8px; font-size: 12px; }
        td { border-bottom: 1px solid #D6DEE8; padding: 8px; font-size: 12px; }
        tr:nth-child(even) { background: #F4F6F9; }
        .grand-total { font-size: 18px; font-weight: bold; color: #1B7A43; text-align: ${isRTL ? 'left' : 'right'}; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="shop-header">
        ${logo ? `<img src="${logo}" />` : ''}
        <div>
          <h1>${escapeHtml(shopName)}</h1>
          ${contact ? `<p class="contact">${escapeHtml(contact)}</p>` : ''}
        </div>
      </div>
      <h2>${escapeHtml(title)} — generated ${new Date().toLocaleString()}</h2>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      ${footerHtml || ''}
    </body>
  </html>`;
}

export async function generatePdfAndShare(html) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' });
  }
  return uri;
}

// For "Print Receipt" buttons — sends straight to the print dialog (or PDF preview on emulator).
export async function printHtml(html) {
  await Print.printAsync({ html });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
