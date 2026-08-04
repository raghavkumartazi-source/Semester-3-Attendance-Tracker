import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AttendanceProvider } from '@/components/AttendanceProvider';
import BottomNav from '@/components/BottomNav';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Semester III Attendance',
  description: 'Personal attendance tracker',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
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
      <body className={`${inter.className} bg-[#07080b] text-zinc-100 antialiased min-h-screen relative overflow-x-hidden selection:bg-white/20`}>
        
        {/* Atmospheric Background — ambient illumination for glass to react to */}
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#07080b]">
          {/* Cool blue-grey illumination — top left */}
          <div className="absolute -top-[30%] -left-[20%] w-[900px] h-[900px] rounded-full opacity-[0.05]"
               style={{ background: 'radial-gradient(circle, rgba(140,160,200,1) 0%, transparent 70%)' }} />
          {/* Neutral silver illumination — bottom right */}
          <div className="absolute -bottom-[20%] -right-[15%] w-[800px] h-[800px] rounded-full opacity-[0.045]"
               style={{ background: 'radial-gradient(circle, rgba(200,200,210,1) 0%, transparent 70%)' }} />
          {/* Very subtle indigo wash — center */}
          <div className="absolute top-[30%] left-[40%] w-[1000px] h-[600px] rounded-full opacity-[0.035]"
               style={{ background: 'radial-gradient(ellipse, rgba(120,120,180,1) 0%, transparent 70%)' }} />
        </div>

        <AttendanceProvider>
          <main className="mx-auto px-4 pt-6 relative z-0">
            {children}
          </main>
          <BottomNav />
        </AttendanceProvider>
        <Analytics />
      </body>
    </html>
  );
}
