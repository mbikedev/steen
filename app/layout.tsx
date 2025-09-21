import type { Metadata } from 'next';
import { Rozha_One, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from 'sonner';
import { DataProvider } from "../lib/DataContext";
import { AuthProvider } from "../lib/AuthContext";

const rozhaOne = Rozha_One({ 
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-rozha-one',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  title: 'OOC Steenokkerzeel Administratie',
  description: 'Administratie dashboard voor opvangcentrum beheer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${rozhaOne.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              {children}
              <Toaster />
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
