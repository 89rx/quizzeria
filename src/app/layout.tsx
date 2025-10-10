import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: 'Quizzeria - AI Learning Companion',
  description: 'Upload PDFs, chat with AI, and generate quizzes from your documents.',
  icons: {
    icon: '/src/app/favicon.svg',
    shortcut: '/src/app/favicon.svg',
    apple: '/src/app/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights/>
        <Analytics/>

      </body>
    </html>
  );
}