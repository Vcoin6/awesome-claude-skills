// Category metadata for landing pages, nav, and SEO.
export const CATEGORIES = [
  { slug: 'apparel', name: 'Apparel', blurb: 'Hoodies, tees, hats and wearable drops from independent creators.' },
  { slug: 'accessories', name: 'Accessories', blurb: 'Stickers, pins, totes and the little extras fans love.' },
  { slug: 'art', name: 'Art & Prints', blurb: 'Posters, risographs and original art you can hang on your wall.' },
  { slug: 'music', name: 'Music', blurb: 'Vinyl, cassettes and tour merch from the artists you follow.' },
  { slug: 'digital', name: 'Digital', blurb: 'Wallpapers, presets, samples and instant downloads.' },
  { slug: 'collectibles', name: 'Collectibles', blurb: 'Enamel pins, figures and limited-run collectibles.' },
  { slug: 'other', name: 'Everything else', blurb: 'One-of-a-kind merch that doesn’t fit a box.' },
];

export function categoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}
