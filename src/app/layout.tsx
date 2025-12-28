import type { Metadata } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import { ThemeProvider } from '@/components/theme';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const rajdhani = Rajdhani({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Game Hub - Your Ultimate Gaming Library',
  description: 'Unify your gaming life across all platforms. Track, manage, and discover your games in one place.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable} overflow-x-hidden`} suppressHydrationWarning>
      <head />
      <body className="overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
