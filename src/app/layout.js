import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FrictionProvider } from "@/context/FrictionContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FRICTION — Workflow Intelligence & Friction Diagnosis",
  description: "Understand your workflow. Find where time is being lost.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#f5f4f0] text-[#111]">
        <FrictionProvider>
          <Navigation />
          <div className="flex-1 flex flex-col">{children}</div>
        </FrictionProvider>
      </body>
    </html>
  );
}
