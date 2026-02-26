// File: apps/web/pages/dashboard/index.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { AllocationWidget } from '@/components/AllocationWidget';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [summary, setSummary] = useState<{ totalIncome?: number; totalExpenses?: number; month?: string } | null>(null);

  useEffect(() => {
    if (isLoaded && !user) router.replace('/');
  }, [isLoaded, user, router]);

  useEffect(() => {
    const month = typeof router.query.month === 'string' ? router.query.month : undefined;
    const q = month ? `?month=${month}` : '';
    fetch(`/api/v1/dashboard${q}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [router.query.month]);

  if (!isLoaded || !user) return null;

  return (
    <Layout>
      <Head><title>Dashboard — Fundigo</title></Head>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold text-text mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm text-text-muted">Income (month)</p>
            <p className="text-2xl font-semibold text-text">
              {summary?.totalIncome != null ? `$${summary.totalIncome.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm text-text-muted">Expenses (month)</p>
            <p className="text-2xl font-semibold text-text">
              {summary?.totalExpenses != null ? `$${summary.totalExpenses.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <p className="text-sm text-text-muted">Month</p>
            <p className="text-2xl font-semibold text-text">{summary?.month ?? new Date().toISOString().slice(0, 7)}</p>
          </div>
        </div>
        <div className="bg-surface rounded-card shadow-card p-6 mb-8">
          <h2 className="text-lg font-medium text-text mb-4">Allocation</h2>
          <AllocationWidget />
        </div>
        <div className="bg-surface rounded-card shadow-card p-6">
          <h2 className="text-lg font-medium text-text mb-4">Recent activity</h2>
          <p className="text-text-muted text-sm">Transactions and goals appear here. Use Expenses and Goals pages to manage.</p>
        </div>
      </div>
    </Layout>
  );
}
