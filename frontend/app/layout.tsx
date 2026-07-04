import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intervyu — AI-Powered Technical Interviews",
  description:
    "Practice with an AI interviewer that analyzes your GitHub, adapts in real-time, and provides actionable feedback across system design, data structures, and communication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased dark font-sans`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster/>
      </body>
    </html>
  );
}
