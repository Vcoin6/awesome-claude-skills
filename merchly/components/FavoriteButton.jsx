'use client';

import { useRouter } from 'next/navigation';
import { useFavorites } from '@/lib/favorites-context';

export default function FavoriteButton({ listingId, size = 18, className = '' }) {
  const router = useRouter();
  const { isFavorite, toggle, loggedIn } = useFavorites();
  const active = isFavorite(listingId);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!loggedIn) {
      router.push('/login');
      return;
    }
    toggle(listingId);
  }

  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Remove from favorites' : 'Save to favorites'}
      className={`grid place-items-center rounded-full bg-black/50 backdrop-blur transition hover:bg-black/70 ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? '#DB2777' : 'none'} stroke={active ? '#DB2777' : 'white'} strokeWidth="1.8">
        <path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2 5 5.2 5c2 0 3.3 1.1 4.1 2.3l.7 1 .7-1C11.5 6.1 12.8 5 14.8 5 18 5 19.5 8.2 22 11.7 19.5 16.4 12 21 12 21z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
