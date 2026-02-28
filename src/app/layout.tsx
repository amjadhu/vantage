import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vantage — Intelligence Dashboard",
  description: "AI-powered intelligence dashboard for technology executives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Sidebar />
        <div className="lg:ml-56 min-h-screen">
          <TopBar />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
