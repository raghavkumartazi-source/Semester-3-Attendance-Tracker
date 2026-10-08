import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { AttendanceProvider } from '@/components/AttendanceProvider';
import { TaskProvider } from '@/components/TaskProvider';
import { WorkSessionProvider } from '@/components/WorkSessionProvider';
import { MarksProvider } from '@/components/MarksProvider';
import { PlannerProvider } from '@/components/PlannerProvider';
import BottomNav from '@/components/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PageTransition from '@/components/PageTransition';
import { CelebrationLayer } from '@/components/CelebrationBurst';
import AppHeader from '@/components/AppHeader';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-ui' });

export const metadata: Metadata = {
  title: '3rd Sem Tracker',
  description: 'Attendance, marks, and exam preparation tracker for Semester III',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '3rd Sem',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#101113',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.className} ${manrope.variable} antialiased`}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <AppHeader />

        <ErrorBoundary>
          <AttendanceProvider>
            <WorkSessionProvider>
              <TaskProvider>
                <MarksProvider>
                  <PlannerProvider>
                    <main id="main-content" className="app-main" tabIndex={-1}>
                      <PageTransition>
                        {children}
                      </PageTransition>
                    </main>
                    <CelebrationLayer />
                  </PlannerProvider>
                </MarksProvider>
              </TaskProvider>
            </WorkSessionProvider>
          </AttendanceProvider>
        </ErrorBoundary>
        <BottomNav />
      </body>
    </html>
  );
}
