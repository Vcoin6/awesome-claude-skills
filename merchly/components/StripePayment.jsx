'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { formatMoney } from '@/lib/format';

// Real card capture via Stripe's Payment Element. Rendered only when the
// checkout API returns a clientSecret (i.e. Stripe keys are configured).
export default function StripePayment({ clientSecret, publishableKey, amountCents, onSuccess }) {
  const stripePromise = loadStripe(publishableKey);
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#7C3AED' } } }}
    >
      <PayForm amountCents={amountCents} onSuccess={onSuccess} />
    </Elements>
  );
}

function PayForm({ amountCents, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setError(submitErr.message);
      setLoading(false);
      return;
    }

    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmErr) {
      setError(confirmErr.message);
      setLoading(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    } else {
      setError('Payment is processing — you’ll receive a confirmation shortly.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full py-4">
        {loading ? 'Processing…' : `Pay ${formatMoney(amountCents)}`}
      </button>
      <p className="text-center text-xs text-white/35">Payments secured by Stripe · Sellers paid 95% automatically</p>
    </form>
  );
}
