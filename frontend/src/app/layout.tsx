'use client';
import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Upload, BarChart3, BookOpen, Info, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import Logo from '@/components/Logo';
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-heading' });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuVariants = {
    closed: { x: '100%' },
    open: { x: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
    exit: { x: '100%', transition: { duration: 0.3, ease: 'easeOut' } },
  };
  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1, transition: { duration: 0.3 } },
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-body bg-surface text-text antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>            
            {/* 🔹 Navbar */}
            <nav className="sticky top-0 z-50 bg-surface-2/90 backdrop-blur-md border-b border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="mx-auto max-w-7xl px-2 xs:px-3 sm:px-6 md:px-8 h-10 xxs:h-12 xs:h-14 flex items-center justify-between">
                
                {/* Logo */}
                <div className="scale-[0.9] origin-left">
                  <Logo />
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  
                  {/* 🔹 Desktop Nav */}
                  <div className="hidden md:flex items-center gap-2">
                    <NavButton href="/upload" icon={<Upload className="h-4 sm:h-5 flex-shrink-0" />} label="Upload" active={pathname === '/upload'} />
                    <NavButton href="/results" icon={<BarChart3 className="h-4 sm:h-5 flex-shrink-0" />} label="Results" active={pathname === '/results'} />
                    <NavButton href="/learning" icon={<BookOpen className="h-4 sm:h-5 flex-shrink-0" />} label="Learning" active={pathname === '/learning'} />
                    <NavButton href="/about" icon={<Info className="h-4 sm:h-5 flex-shrink-0" />} label="About" active={pathname === '/about'} />
                  </div>

                  {/* 🔹 Desktop Theme + Auth */}
                  <div className="hidden md:flex items-center gap-2">
                    <ThemeToggle />
                    <AuthButtons />
                  </div>

                  {/* 🔹 Mobile Menu Trigger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden btn-hover rounded-lg"
                    onClick={() => setIsMenuOpen(true)}
                    aria-label="Open Menu"
                  >
                    <Menu className="h-5 text-text" />
                  </Button>
                </div>
              </div>
            </nav>

            {/* 🔹 Mobile Menu Overlay */}
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div
                    variants={overlayVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <motion.div
                    variants={menuVariants}
                    initial="closed"
                    animate="open"
                    exit="exit"
                    drag="x"
                    dragConstraints={{ right: 0, left: -100 }}
                    dragElastic={0.2}
                    onDragEnd={(_: any, info: any) => {
                      if (info.offset.x < -100) setIsMenuOpen(false);
                    }}
                    className="side-menu fixed inset-y-0 right-0 h-full w-64 xxs:w-72 xs:w-[80vw] z-50 md:hidden overflow-y-auto flex flex-col gap-3 p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between w-full border-b border-border pb-3">
                      <div className="flex items-center gap-3">
                        <div className="scale-[0.9]">
                          <Logo />
                        </div>
                        <AuthHeader />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="btn-hover rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                        aria-label="Close Menu"
                      >
                        <X className="h-5 text-text" />
                      </Button>
                    </div>

                    {/* Mobile Nav */}
                    <nav className="flex flex-col items-center gap-3 mt-3">
                      <NavButtonMobile href="/upload" icon={<Upload className="h-5 flex-shrink-0" />} label="Upload" active={pathname === '/upload'} onClick={() => setIsMenuOpen(false)} />
                      <NavButtonMobile href="/results" icon={<BarChart3 className="h-5 flex-shrink-0" />} label="Results" active={pathname === '/results'} onClick={() => setIsMenuOpen(false)} />
                      <NavButtonMobile href="/learning" icon={<BookOpen className="h-5 flex-shrink-0" />} label="Learning" active={pathname === '/learning'} onClick={() => setIsMenuOpen(false)} />
                      <NavButtonMobile href="/about" icon={<Info className="h-5 flex-shrink-0" />} label="About" active={pathname === '/about'} onClick={() => setIsMenuOpen(false)} />
                    </nav>

                    <hr className="border-border my-3" />
                    <ThemeToggle />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* 🔹 Main Content */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mx-auto max-w-full xs:max-w-7xl px-3 sm:px-6 md:px-8 py-5 sm:py-8 md:py-12 overflow-hidden"
            >
              {children}
            </motion.main>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

/* 🔹 Desktop Nav Button */
function NavButton({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Button
      variant={active ? 'default' : 'ghost'}
      className={`btn w-[140px] flex items-center justify-center gap-2 text-sm sm:text-base 
        ${active ? 'btn-active' : 'btn-hover'} h-10 sm:h-11`}
    >
      <a href={href} className="flex w-full h-full items-center justify-center gap-2" aria-label={label}>
        {icon}
        <span className="leading-none">{label}</span>
      </a>
    </Button>
  );
}

/* 🔹 Mobile Nav Button */
function NavButtonMobile({ href, icon, label, active, onClick }: { href: string; icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      variant={active ? 'default' : 'ghost'}
      className={`btn w-full flex items-center justify-center gap-2 text-sm sm:text-base 
        ${active ? 'btn-active' : 'btn-hover'} h-11`}
      onClick={onClick}
    >
      <a href={href} className="flex w-full h-full items-center justify-center gap-2" aria-label={label}>
        {icon}
        <span className="leading-none">{label}</span>
      </a>
    </Button>
  );
}

/* 🔹 Theme Toggle */
function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Button
      variant="ghost"
      className="btn flex items-center justify-center gap-2 text-sm btn-hover h-10"
      onClick={toggleTheme}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-5 text-muted flex-shrink-0" />
          <span className="leading-none">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-5 text-muted flex-shrink-0" />
          <span className="leading-none">Dark Mode</span>
        </>
      )}
    </Button>
  );
}

/* 🔹 Auth Header (Mobile) */
function AuthHeader() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="flex items-center gap-3">
      {session?.user ? (
        <>
          <span className="text-sm font-semibold text-accent truncate max-w-[36px] scale-[0.9]">
            {session.user.name ? getInitials(session.user.name) : 'U'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="btn btn-hover text-xs"
            onClick={() => signOut()}
            aria-label="Sign Out"
          >
            Sign Out
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="btn btn-hover text-xs"
          onClick={() => signIn()}
          aria-label="Sign In"
        >
          Sign In
        </Button>
      )}
    </div>
  );
}

/* 🔹 Auth Buttons (Desktop) */
function AuthButtons() {
  const { data: session } = useSession();

  return (
    <div className="flex items-center gap-2">
      {session?.user ? (
        <Button
          variant="ghost"
          size="sm"
          className="btn btn-hover text-xs sm:text-sm"
          onClick={() => signOut()}
          aria-label="Sign Out"
        >
          Sign Out
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="btn btn-hover text-xs sm:text-sm"
          onClick={() => signIn()}
          aria-label="Sign In"
        >
          Sign In
        </Button>
      )}
    </div>
  );
}
