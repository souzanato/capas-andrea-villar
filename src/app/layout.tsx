import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Capas Andrea Villar",
    template: "%s · Capas Andrea Villar",
  },
  description: "Capas que impulsionam — gerador editorial de capas para Instagram, com identidade Andrea Villar.",
  applicationName: "Capas Andrea Villar",
  authors: [{ name: "Andrea Villar" }],
  keywords: ["instagram", "capas", "design editorial", "maternidade", "andrea villar"],
  openGraph: {
    title: "Capas Andrea Villar",
    description: "Capas que impulsionam.",
    type: "website",
    locale: "pt_BR",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
