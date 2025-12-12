import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Lumina | Digital Signage Software",
  description: "Turn any screen into a communication powerhouse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-[#0B0F19] text-white selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
