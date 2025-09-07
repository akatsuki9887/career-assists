'use client';
import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Upload, BarChart3, BookOpen, Info, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-heading' });
export default function RootLayout({ children }: { children: React.ReactNode }) {
const pathname = usePathname();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-body bg-surface text-text antialiased`}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <nav className="sticky top-0 z-50 bg-surface-2/80 backdrop-blur-md border-b border-border transition-colors duration-300">
            <div className="mx-auto flex items-center justify-between h-16 px-4 md:px-8 max-w-6xl">
              <Logo />
              <div className="flex items-center gap-4 md:gap-8">
                <div className="hidden md:flex gap-4 md:gap-6">
                  <Button variant={pathname === '/upload' ? 'default' : 'ghost'} className="flex items-center gap-2 text-muted hover:text-accent transition-colors">
                    <a href="/upload" className="flex items-center gap-2" aria-label="Upload Resume">
                      <Upload className="h-5 w-5" />
                      Upload
                    </a>
                  </Button>
                  <Button variant={pathname === '/results' ? 'default' : 'ghost'} className="flex items-center gap-2 text-muted hover:text-accent transition-colors">
                    <a href="/results" className="flex items-center gap-2" aria-label="View Results">
                      <BarChart3 className="h-5 w-5" />
                      Results
                    </a>
                  </Button>
                  <Button variant={pathname === '/learning' ? 'default' : 'ghost'} className="flex items-center gap-2 text-muted hover:text-accent transition-colors">
                    <a href="/learning" className="flex items-center gap-2" aria-label="Learning Plan">
                      <BookOpen className="h-5 w-5" />
                      Learning
                    </a>
                  </Button>
                  <Button variant={pathname === '/about' ? 'default' : 'ghost'} className="flex items-center gap-2 text-muted hover:text-accent transition-colors">
                    <a href="/about" className="flex items-center gap-2" aria-label="About Page">
                      <Info className="h-5 w-5" />
                      About
                    </a>
                  </Button>
                </div>
                <ThemeToggle />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open Menu">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[240px] sm:w-[300px] bg-surface-2 border-border">
                    <nav className="flex flex-col gap-4 mt-6">
                      <Button variant={pathname === '/upload' ? 'default' : 'ghost'} className="justify-start gap-2">
                        <a href="/upload" className="flex items-center gap-2" aria-label="Upload Resume">
                          <Upload className="h-5 w-5" />
                          Upload
                        </a>
                      </Button>
                      <Button variant={pathname === '/results' ? 'default' : 'ghost'} className="justify-start gap-2">
                        <a href="/results" className="flex items-center gap-2" aria-label="View Results">
                          <BarChart3 className="h-5 w-5" />
                          Results
                        </a>
                      </Button>
                      <Button variant={pathname === '/learning' ? 'default' : 'ghost'} className="justify-start gap-2">
                        <a href="/learning" className="flex items-center gap-2" aria-label="Learning Plan">
                          <BookOpen className="h-5 w-5" />
                          Learning
                        </a>
                      </Button>
                      <Button variant={pathname === '/about' ? 'default' : 'ghost'} className="justify-start gap-2">
                        <a href="/about" className="flex items-center gap-2" aria-label="About Page">
                          <Info className="h-5 w-5" />
                          About
                        </a>
                      </Button>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </nav>
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto px-4 py-8 md:py-12 max-w-[1100px]"
          >
            {children}
          </motion.main>
        </ThemeProvider>
      </body>
    </html>
  );
}
function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [forceRender, setForceRender] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setForceRender(prev => !prev); 
  };
  if (!mounted) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="hover:scale-105 transition-transform"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5 text-neutral-light" /> : <Moon className="h-5 w-5 text-neutral" />}
    </Button>
  );
}