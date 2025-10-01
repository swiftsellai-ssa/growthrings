import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth Rings - Track Your X/Twitter Growth",
  description: "Create beautiful progress rings to showcase your X/Twitter follower milestones",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}