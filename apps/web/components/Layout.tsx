// File: apps/web/components/Layout.tsx
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background font-sans text-text">
      <nav className="bg-surface border-b border-gray-200 shadow-card">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-medium text-text">
            Fundigo
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-text-muted hover:text-text text-sm">Dashboard</Link>
            <Link href="/income" className="text-text-muted hover:text-text text-sm">Income</Link>
            <Link href="/subscriptions" className="text-text-muted hover:text-text text-sm">Subscriptions</Link>
            <Link href="/expenses" className="text-text-muted hover:text-text text-sm">Expenses</Link>
            <Link href="/settings" className="text-text-muted hover:text-text text-sm">Settings</Link>
            {user && <UserButton afterSignOutUrl="/" />}
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
