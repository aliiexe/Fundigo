// File: apps/web/pages/onboarding/index.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';

export default function Onboarding() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profession, setProfession] = useState('');
  const [goal, setGoal] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) router.replace('/');
  }, [isLoaded, user, router]);

  const ensureUser = async () => {
    const res = await fetch('/api/v1/auth/ensure-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profession: profession || undefined, primary_goal: goal || undefined }),
    });
    if (!res.ok) throw new Error('ensure-user failed');
  };

  const handleNext = async () => {
    if (step === 0) {
      await ensureUser();
      setStep(1);
    } else if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else {
      setDone(true);
      router.push('/dashboard');
    }
  };

  if (!isLoaded || !user) return null;

  return (
    <Layout>
      <Head><title>Onboarding — Fundigo</title></Head>
      <div className="max-w-xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-semibold text-text mb-8">Get started</h1>
        {step === 0 && (
          <div className="space-y-6">
            <label className="block">
              <span className="text-text-muted text-sm">Profession (optional)</span>
              <input
                type="text"
                className="mt-1 block w-full rounded-input border border-gray-300 px-4 py-3 text-text"
                placeholder="e.g. Software engineer"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                aria-label="Profession"
              />
            </label>
            <label className="block">
              <span className="text-text-muted text-sm">Primary goal (optional)</span>
              <input
                type="text"
                className="mt-1 block w-full rounded-input border border-gray-300 px-4 py-3 text-text"
                placeholder="e.g. Save for house"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                aria-label="Primary goal"
              />
            </label>
          </div>
        )}
        {step === 1 && (
          <p className="text-text-muted">Add your first income source on the Income page after finishing.</p>
        )}
        {step === 2 && (
          <p className="text-text-muted">Add subscriptions on the Subscriptions page.</p>
        )}
        {step === 3 && (
          <p className="text-text-muted">Upload a receipt or add a manual expense on the Expenses page. You can try the allocation widget on the dashboard.</p>
        )}
        <div className="mt-10 flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-primary text-white rounded-input hover:bg-primary-hover transition-colors"
          >
            {step === 3 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
