import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AttendanceProvider } from '@/components/AttendanceProvider';
import { TaskProvider } from '@/components/TaskProvider';
import { WorkSessionProvider } from '@/components/WorkSessionProvider';
import BottomNav from '@/components/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PageTransition from '@/components/PageTransition';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Semester III Attendance',
  description: 'Personal attendance tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Attendance',
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
  themeColor: '#07080b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-[#07080b] text-zinc-100 antialiased min-h-screen relative overflow-x-hidden selection:bg-white/20`}>
        
        {/* Atmospheric Animated Background */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#07080b]">
          {/* Deep vibrant emerald orb — top left */}
          <div className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] rounded-full opacity-[0.06] animate-orb"
               style={{ background: 'radial-gradient(circle, rgba(16,185,129,1) 0%, transparent 60%)' }} />
          
          {/* Deep royal blue orb — bottom right */}
          <div className="absolute -bottom-[20%] -right-[10%] w-[900px] h-[900px] rounded-full opacity-[0.05] animate-orb-slow"
               style={{ background: 'radial-gradient(circle, rgba(59,130,246,1) 0%, transparent 60%)' }} />
               
          {/* Subtle violet wash — center shifting */}
          <div className="absolute top-[60%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.05] animate-orb-slow"
               style={{ background: 'radial-gradient(circle, rgba(139,92,246,1) 0%, transparent 60%)' }} />
        </div>

        <ErrorBoundary>
          <AttendanceProvider>
            <WorkSessionProvider>
              <TaskProvider>
                <main className="mx-auto px-4 pt-6 pb-28 min-h-screen flex flex-col relative z-0">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
                <BottomNav />
              </TaskProvider>
            </WorkSessionProvider>
          </AttendanceProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
