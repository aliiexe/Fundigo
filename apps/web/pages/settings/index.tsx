// File: apps/web/pages/settings/index.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function Settings() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) router.replace('/');
  }, [isLoaded, user, router]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/v1/data/export', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) alert(data.downloadUrl ? `Download: ${data.downloadUrl}` : 'Export queued.');
      else alert(data.error || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete your account and data?')) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/v1/me/delete', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Account deletion scheduled. Sign out and contact support if needed.');
        router.push('/');
      } else alert(data.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (!isLoaded || !user) return null;
  return (
    <Layout>
      <Head><title>Settings — Fundigo</title></Head>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-semibold text-text mb-6">Settings</h1>
        <div className="space-y-6">
          <section className="bg-surface rounded-card shadow-card p-6">
            <h2 className="text-lg font-medium text-text mb-2">Security</h2>
            <p className="text-text-muted text-sm mb-4">Manage your account via Clerk (sign out, password, etc.).</p>
            <a href="https://accounts.clerk.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Clerk account management</a>
          </section>
          <section className="bg-surface rounded-card shadow-card p-6">
            <h2 className="text-lg font-medium text-text mb-2">E2E encryption</h2>
            <p className="text-text-muted text-sm">Toggle opt-in E2E encryption (client library TODO).</p>
          </section>
          <section className="bg-surface rounded-card shadow-card p-6">
            <h2 className="text-lg font-medium text-text mb-2">Data export</h2>
            <button onClick={handleExport} disabled={exporting} className="px-4 py-2 bg-primary text-white rounded-input hover:bg-primary-hover disabled:opacity-50">
              {exporting ? '…' : 'Export my data'}
            </button>
          </section>
          <section className="bg-surface rounded-card shadow-card p-6">
            <h2 className="text-lg font-medium text-accent mb-2">Delete account</h2>
            <p className="text-text-muted text-sm mb-4">Soft-delete and schedule purge. This cannot be undone.</p>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-accent text-white rounded-input hover:opacity-90 disabled:opacity-50">
              {deleting ? '…' : 'Delete my account'}
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
