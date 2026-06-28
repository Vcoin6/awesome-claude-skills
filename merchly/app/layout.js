import './globals.css';
import { Space_Grotesk, Inter } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth';
import { FavoritesProvider } from '@/lib/favorites-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});
const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Merchly — Sell your merch. Keep 95%.',
  description:
    'Merchly is the creator-first marketplace for selling merchandise with photos and video. List in seconds, get paid instantly, keep 95% of every sale.',
  openGraph: {
    title: 'Merchly — Sell your merch. Keep 95%.',
    description:
      'The creator-first marketplace for selling merch with photos & video. Keep 95% of every sale.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#0B0B12',
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <FavoritesProvider loggedIn={!!user}>
          <Navbar user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </FavoritesProvider>
      </body>
    </html>
  );
}
