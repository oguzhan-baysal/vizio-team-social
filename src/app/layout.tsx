import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TeamSocial — Team-Based Social Media",
  description:
    "A team-based social media platform where teams share their voice. Follow teams, discover content, and post on behalf of your team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <Navbar />
        <main className="main-content">{children}</main>
      </body>
    </html>
  );
}
