// File: apps/web/components/ClerkSignIn.tsx
import { SignInButton } from '@clerk/nextjs';

export function ClerkSignIn() {
  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="px-6 py-3 bg-primary text-white rounded-input hover:bg-primary-hover transition-colors font-medium"
        aria-label="Sign in with Clerk"
      >
        Sign in
      </button>
    </SignInButton>
  );
}
