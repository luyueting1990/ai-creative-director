import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "AI Creative Director — Fashion campaign studio (demo)",
  description:
    "Turn a fashion brand brief into three campaign concepts with moodboards, editable storyboards, shot lists, hooks and captions. Interactive demo — no API key required.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body className="grain min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
