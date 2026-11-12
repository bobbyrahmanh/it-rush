import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import Loader from "@/components/Loader";
import Navbar from "@/components/Navbar";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "SIGNIFY: Belajar BISINDO & Braille",
  description: "Belajar alfabet BISINDO dan pola Braille secara interaktif, tanpa daftar akun.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>
        <Loader />
        <a href="#utama" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-sun focus:px-4 focus:py-2">Lompat ke konten</a>
        <Navbar />
        <main id="utama">{children}</main>
      </body>
    </html>
  );
}
