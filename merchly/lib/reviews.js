// Review aggregation helpers (pure functions, shared by API routes + pages).

export function summarize(reviews) {
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { avg: Math.round(avg * 10) / 10, count };
}

export function listingRating(allReviews, listingId) {
  return summarize(allReviews.filter((r) => r.listingId === listingId));
}

export function sellerRating(allReviews, sellerId) {
  return summarize(allReviews.filter((r) => r.sellerId === sellerId));
}

// Attach a { avg, count } rating to each listing for cards/listings responses.
export function attachRatings(listings, allReviews) {
  return listings.map((l) => ({ ...l, rating: listingRating(allReviews, l.id) }));
}

// A buyer may review a listing only if they have a PAID order containing it
// and haven't already reviewed it.
export function canUserReview({ reviews, orders, userId, listingId }) {
  if (!userId) return false;
  const alreadyReviewed = reviews.some((r) => r.listingId === listingId && r.buyerId === userId);
  if (alreadyReviewed) return false;
  return orders.some(
    (o) => o.buyerId === userId && o.status === 'paid' && o.items.some((i) => i.listingId === listingId)
  );
}
