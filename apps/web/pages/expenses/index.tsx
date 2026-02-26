// File: apps/web/pages/expenses/index.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function Expenses() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [list, setList] = useState<Array<{ id: string; amount: number; date: string }>>([]);

  useEffect(() => {
    if (isLoaded && !user) router.replace('/');
  }, [isLoaded, user, router]);
  useEffect(() => {
    fetch('/api/v1/expenses/list').then((r) => r.ok ? r.json() : []).then(setList).catch(() => setList([]));
  }, []);

  if (!isLoaded || !user) return null;
  return (
    <Layout>
      <Head><title>Expenses — Fundigo</title></Head>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold text-text mb-6">Expenses</h1>
        <p className="text-text-muted text-sm mb-4">Manual add and receipt upload (API: /api/v1/expenses/manual, /api/v1/expenses/receipt).</p>
        <ul className="space-y-4">
          {list.map((e) => (
            <li key={e.id} className="bg-surface rounded-card shadow-card p-4 flex justify-between items-center">
              <span className="text-text">${e.amount}</span>
              <span className="text-text-muted text-sm">{e.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
