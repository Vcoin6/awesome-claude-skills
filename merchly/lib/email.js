// Transactional email via Resend (https://resend.com). Gated by RESEND_API_KEY
// — with no key, every call is a no-op so the app runs fine without email.
import { formatMoney } from './format';

export function isEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM || 'Merchly <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }) {
  if (!isEmailEnabled() || !to) return { skipped: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

function shell(title, body) {
  return `<div style="font-family:Inter,Arial,sans-serif;background:#0B0B12;color:#ECECF4;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#181826;border:1px solid #26263A;border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(120deg,#7C3AED,#DB2777,#F59E0B);padding:20px 24px;font-size:20px;font-weight:700;color:#fff">Merchly</div>
      <div style="padding:24px">
        <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
        ${body}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #26263A;color:#62627A;font-size:12px">Sell your merch. Keep 95%.</div>
    </div>
  </div>`;
}

function itemRows(order) {
  return order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#9A9AAE">${i.qty}× ${i.title}${i.variantLabel ? ` (${i.variantLabel})` : ''}</td>
         <td style="padding:6px 0;text-align:right">${formatMoney(i.priceCents * i.qty)}</td></tr>`
    )
    .join('');
}

export async function emailOrderReceipt(order) {
  if (!order.buyerEmail) return;
  const body = `
    <p style="color:#9A9AAE">Thanks for your order from <strong style="color:#fff">${order.sellerName}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">${itemRows(order)}
      ${order.discount ? `<tr><td style="padding:6px 0;color:#10B981">Discount${order.code ? ` (${order.code})` : ''}</td><td style="padding:6px 0;text-align:right;color:#10B981">−${formatMoney(order.discount)}</td></tr>` : ''}
      <tr><td style="padding:10px 0 0;font-weight:700">Total paid</td><td style="padding:10px 0 0;text-align:right;font-weight:700">${formatMoney(order.amount)}</td></tr>
    </table>
    <p style="color:#62627A;font-size:13px">Order #${order.id.slice(-6).toUpperCase()}</p>`;
  return sendEmail({ to: order.buyerEmail, subject: `Your Merchly receipt — ${formatMoney(order.amount)}`, html: shell('Order confirmed 🎉', body) });
}

export async function emailNewSale(order, sellerEmail) {
  if (!sellerEmail) return;
  const body = `
    <p style="color:#9A9AAE">You made a sale to <strong style="color:#fff">${order.buyerName}</strong>!</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">${itemRows(order)}
      <tr><td style="padding:10px 0 0;font-weight:700;color:#DB2777">You earned (95%)</td><td style="padding:10px 0 0;text-align:right;font-weight:700;color:#DB2777">${formatMoney(order.sellerNet)}</td></tr>
    </table>
    ${order.shipping?.address ? `<p style="color:#9A9AAE;font-size:13px">Ship to: ${order.shipping.name}, ${order.shipping.address}, ${order.shipping.city} ${order.shipping.zip} ${order.shipping.country}</p>` : ''}`;
  return sendEmail({ to: sellerEmail, subject: `New sale on Merchly — ${formatMoney(order.sellerNet)}`, html: shell('You made a sale! 🎉', body) });
}
