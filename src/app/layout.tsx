import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morse Code Converter - Convert Text to Morse Code",
  description: "Convert between text and Morse code instantly. Real-time conversion with audio, flashlight, and vibration output. Installable as PWA.",
  openGraph: {
    title: "Morse Code Converter",
    description: "Real-time Morse code converter with audio playback, flashlight signal, and vibration. Works offline as a PWA.",
    type: "website",
    url: "https://your-domain.com",
    images: [
      {
        url: "/icon-512.svg",
        width: 512,
        height: 512,
        alt: "Morse Code Converter"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Morse Code Converter",
    description: "Real-time Morse code converter with audio playback, flashlight signal, and vibration. Works offline as a PWA.",
    images: ["/icon-512.svg"]
  },
  keywords: ["morse code", "converter", "translator", "audio", "PWA", "offline", "flashlight", "vibration"]
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
