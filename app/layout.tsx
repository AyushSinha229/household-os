import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Household OS | Intelligent Indian Household Management",
  description:
    "Autonomous AI-powered household management operating system for Indian homes. Real-time inventory, predictive maintenance, document intelligence, and utility finances.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
