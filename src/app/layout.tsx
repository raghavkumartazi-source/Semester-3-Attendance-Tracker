import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
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
import BackgroundFX from '@/components/BackgroundFX';

const outfit = Outfit({ subsets: ['latin'] });

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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050508',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-[#050508] text-white antialiased min-h-dvh relative overflow-x-hidden selection:bg-white/20`}>

        <ErrorBoundary>
          <AttendanceProvider>
            <BackgroundFX />
            <WorkSessionProvider>
              <TaskProvider>
                <MarksProvider>
                  <PlannerProvider>
                    <div className="relative flex flex-col min-h-dvh">
                      <main className="flex-1 mx-auto px-4 pt-safe pb-28 min-h-0">
                        <PageTransition>
                          {children}
                        </PageTransition>
                      </main>
                      <BottomNav />
                      <CelebrationLayer />
                    </div>
                  </PlannerProvider>
                </MarksProvider>
              </TaskProvider>
            </WorkSessionProvider>
          </AttendanceProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
