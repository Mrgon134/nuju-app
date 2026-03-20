import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuju — AI Journal That Understands Your Life",
  description: "The 30-second AI journal companion. Track moods, discover patterns, talk to Ju.",
  keywords: "journal, AI, mood tracker, mental health, diary",
  openGraph: {
    title: "Nuju — AI Journal That Understands Your Life",
    description: "The 30-second AI journal companion.",
    url: "https://nuju.app",
    siteName: "Nuju",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#7C6EDB" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;0,700&family=Newsreader:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
