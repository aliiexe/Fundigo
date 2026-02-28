import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

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
          colorBackground: "#0B0B0D",
          colorInputBackground: "#141415",
          colorInputText: "#FFFFFF",
          colorText: "#FFFFFF",
          colorTextSecondary: "#BDBDBD",
          colorDanger: "#ef4444",
          colorSuccess: "#10b981",
          colorWarning: "#f59e0b",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
        },
        elements: {
          card: "bg-[#141415] border border-[#252527] shadow-2xl shadow-black/50",
          headerTitle: "text-[#FFFFFF]",
          headerSubtitle: "text-[#BDBDBD]",
          socialButtonsBlockButton: "bg-[#1A1A1B] border-[#252527] text-[#FFFFFF] hover:bg-[#141415] hover:border-[#2e2e30]",
          socialButtonsBlockButtonText: "text-[#FFFFFF]",
          formFieldLabel: "text-[#BDBDBD]",
          formFieldInput: "bg-[#141415] border-[#252527] text-[#FFFFFF] focus:border-[#FF4000] focus:ring-[#FF4000]/20",
          formButtonPrimary: "bg-[#FF4000] hover:bg-[#FF9A4D] text-white",
          footerActionLink: "text-[#FF4000] hover:text-[#FF9A4D]",
          identityPreview: "bg-[#141415] border-[#252527]",
          identityPreviewText: "text-[#FFFFFF]",
          identityPreviewEditButton: "text-[#FF4000]",
          formFieldAction: "text-[#FF4000]",
          userButtonPopoverCard: "bg-[#0B0B0D] border border-[#252527]",
          userButtonPopoverActionButton: "text-[#FFFFFF] hover:bg-[#1A1A1B]",
          userButtonPopoverActionButtonText: "text-[#FFFFFF]",
          userButtonPopoverActionButtonIcon: "text-[#8a8a8c]",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "text-[#FFFFFF]",
          userPreviewSecondaryIdentifier: "text-[#BDBDBD]",
          avatarBox: "ring-2 ring-[#252527]",
          badge: "bg-[#FF4000]/10 text-[#FF4000]",
          dividerLine: "bg-[#252527]",
          dividerText: "text-[#8a8a8c]",
          formFieldInputShowPasswordButton: "text-[#8a8a8c] hover:text-[#FFFFFF]",
          otpCodeFieldInput: "bg-[#141415] border-[#252527] text-[#FFFFFF]",
          alert: "bg-[#141415] border-[#252527]",
          alertText: "text-[#FFFFFF]",
          modalBackdrop: "bg-black/70 backdrop-blur-sm",
        },
      }}
    >
      <html lang="en" className="dark">
        <body className={`${plusJakarta.variable} font-sans antialiased min-h-screen`}>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </body>
      </html>
      <Analytics />
    </ClerkProvider>
  );
}
