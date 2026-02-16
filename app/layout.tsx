import './globals.css';
import type { Metadata } from "next";
import Background from "@/components/Background";
import { MusicKitProvider } from "@/components/providers/MusicKitProvider";

export const metadata: Metadata = {
  title: "SoundCircle",
  description: "Share your music journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      { }
      <head>
        <meta name="referrer" content="origin-when-cross-origin" />
      </head>
      <body className="min-h-screen bg-black antialiased">
        <MusicKitProvider>
          {children}
        </MusicKitProvider>
      </body>
    </html>
  );
}