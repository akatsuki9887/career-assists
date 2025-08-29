import './globals.css';
import { Inter } from 'next/font/google';
import { AnalysisProvider } from '@/context/store';

const inter = Inter({ subsets: ['latin'] });
export const metadata = { title: 'Career Assist', description: 'AI skill gap analyzer' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <AnalysisProvider>
          <nav className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
            <div className="container flex items-center justify-between h-14">
              <span className="font-semibold">CareerAssist</span>
              <a href="/upload" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">Try Demo</a>
            </div>
          </nav>
          <main className="container py-8">{children}</main>
        </AnalysisProvider>
      </body>
    </html>
  );
}