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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
