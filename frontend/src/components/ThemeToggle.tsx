'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="p-2 rounded-full hover:bg-neutral/20"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-neutral/20 hover:scale-105 transition-transform duration-150"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5 text-neutral-light" /> : <Moon className="h-5 w-5 text-neutral" />}
    </Button>
  );
}