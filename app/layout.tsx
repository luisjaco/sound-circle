import './globals.css';
import type { Metadata } from "next";
import Background from "@/components/Background";

export const metadata: Metadata = {
  title: "SoundCircle",
  description: "Share your music journey",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {}
      <body className="min-h-screen bg-black antialiased">
        {children}
      </body>
    </html>
  );
}