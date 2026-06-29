// Promo/discount helpers.

export function promoDiscount(promo, subtotalCents) {
  if (!promo) return 0;
  const raw =
    promo.type === 'percent'
      ? Math.round((subtotalCents * promo.value) / 100)
      : Math.round(promo.value * 100); // fixed amount stored in dollars
  return Math.max(0, Math.min(subtotalCents, raw));
}

// Validate a promo against a seller subtotal (cents). Returns { ok, discount } or { ok:false, error }.
export function validatePromo(promo, subtotalCents, now = Date.now()) {
  if (!promo || !promo.active) return { ok: false, error: 'Invalid or inactive code.' };
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now) {
    return { ok: false, error: 'This code has expired.' };
  }
  if (promo.maxUses && promo.uses >= promo.maxUses) {
    return { ok: false, error: 'This code has reached its usage limit.' };
  }
  if (promo.minSubtotal && subtotalCents < promo.minSubtotal * 100) {
    return { ok: false, error: `Spend at least $${promo.minSubtotal} to use this code.` };
  }
  return { ok: true, discount: promoDiscount(promo, subtotalCents) };
}

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().slice(0, 24);
}
