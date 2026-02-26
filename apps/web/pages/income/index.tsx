// File: apps/web/pages/income/index.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function Income() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [list, setList] = useState<Array<{ id: string; name: string; amount: number; frequency: string }>>([]);

  useEffect(() => {
    if (isLoaded && !user) router.replace('/');
  }, [isLoaded, user, router]);
  useEffect(() => {
    fetch('/api/v1/income').then((r) => r.ok ? r.json() : []).then(setList).catch(() => setList([]));
  }, []);

  if (!isLoaded || !user) return null;
  return (
    <Layout>
      <Head><title>Income — Fundigo</title></Head>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold text-text mb-6">Income</h1>
        <ul className="space-y-4">
          {list.map((i) => (
            <li key={i.id} className="bg-surface rounded-card shadow-card p-4 flex justify-between items-center">
              <span className="font-medium text-text">{i.name}</span>
              <span className="text-text-muted">${i.amount}{i.frequency === 'irregular' ? ' (irregular)' : ` / ${i.frequency}`}</span>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
