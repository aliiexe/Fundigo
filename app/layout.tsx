import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fundigo — Smart Personal Finance",
  description: "Track, plan, and optimize your finances. Privacy-first with smart allocation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#FF4000",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#111111",
          colorInputText: "#e8e8e8",
          colorText: "#e8e8e8",
          colorTextSecondary: "#737373",
          colorDanger: "#ef4444",
          colorSuccess: "#10b981",
          colorWarning: "#f59e0b",
          borderRadius: "0.75rem",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif",
        },
        elements: {
          card: "bg-[#0a0a0a] border border-[#1e1e1e] shadow-2xl shadow-black/50",
          headerTitle: "text-[#e8e8e8]",
          headerSubtitle: "text-[#737373]",
          socialButtonsBlockButton: "bg-[#111111] border-[#1e1e1e] text-[#e8e8e8] hover:bg-[#191919] hover:border-[#2a2a2a]",
          socialButtonsBlockButtonText: "text-[#e8e8e8]",
          formFieldLabel: "text-[#737373]",
          formFieldInput: "bg-[#111111] border-[#1e1e1e] text-[#e8e8e8] focus:border-[#FF4000] focus:ring-[#FF4000]/20",
          formButtonPrimary: "bg-[#FF4000] hover:bg-[#FF5C26] text-white",
          footerActionLink: "text-[#FF4000] hover:text-[#FF5C26]",
          identityPreview: "bg-[#111111] border-[#1e1e1e]",
          identityPreviewText: "text-[#e8e8e8]",
          identityPreviewEditButton: "text-[#FF4000]",
          formFieldAction: "text-[#FF4000]",
          userButtonPopoverCard: "bg-[#0a0a0a] border border-[#1e1e1e]",
          userButtonPopoverActionButton: "text-[#e8e8e8] hover:bg-[#191919]",
          userButtonPopoverActionButtonText: "text-[#e8e8e8]",
          userButtonPopoverActionButtonIcon: "text-[#525252]",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "text-[#e8e8e8]",
          userPreviewSecondaryIdentifier: "text-[#737373]",
          avatarBox: "ring-2 ring-[#1e1e1e]",
          badge: "bg-[#FF4000]/10 text-[#FF4000]",
          dividerLine: "bg-[#1e1e1e]",
          dividerText: "text-[#525252]",
          formFieldInputShowPasswordButton: "text-[#525252] hover:text-[#e8e8e8]",
          otpCodeFieldInput: "bg-[#111111] border-[#1e1e1e] text-[#e8e8e8]",
          alert: "bg-[#111111] border-[#1e1e1e]",
          alertText: "text-[#e8e8e8]",
          modalBackdrop: "bg-black/70 backdrop-blur-sm",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="antialiased min-h-screen">
          {children}
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
