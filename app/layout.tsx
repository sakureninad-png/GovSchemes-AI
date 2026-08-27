import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GovSchemes AI — Find Government Schemes You Qualify For",
  description:
    "Free AI-powered platform helping Indian citizens discover government welfare schemes they are eligible for. Powered by official myScheme.gov.in data.",
  keywords: [
    "government schemes",
    "India",
    "welfare",
    "eligibility",
    "AI recommendations",
    "myScheme",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
