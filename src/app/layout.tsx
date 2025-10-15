import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morse Code Converter - Convert Text to Morse Code",
  description: "Convert between text and Morse code instantly. Support for letters, numbers, and punctuation with audio playback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Morse Code" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
