'use client';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Github } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const handleSignIn = async () => {
    try {
      await signIn('github', { callbackUrl: '/upload' });
    } catch (err) {
      setError('Failed to sign in with GitHub. Please try again.');
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen bg-surface px-4 sm:px-6 md:px-8"
    >
      <Card className="max-w-md w-full p-6 sm:p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-accent text-center">Sign In to Career Assist</h1>
        <p className="text-muted text-center mb-6 text-sm sm:text-base">Sign in with your GitHub account to continue.</p>
        {error && <p className="text-danger text-center mb-4 text-sm">{error}</p>}
        <Button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-transform hover:scale-105 duration-150"
        >
          <Github className="h-5 w-5" />
          Sign in with GitHub
        </Button>
      </Card>
    </motion.div>
  );
}