'use client';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
export default function AuthButton() {
  const { data: session } = useSession();
  if (session) {
    return (
      <div className="flex items-center gap-2 text-sm sm:text-base">
        <span>Hi, {session.user?.name || session.user?.login}</span>
        <Button variant="destructive" className="rounded-xl" onClick={() => signOut({ callbackUrl: '/' })}>Logout</Button>
      </div>
    );
  }
  return <Button className="rounded-xl" onClick={() => signIn('github', { callbackUrl: '/upload' })}>Login</Button>;
}