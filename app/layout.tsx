import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pillar 5 Aptitude Test",
  description: "Discover your top role pathways at Pillar 5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
