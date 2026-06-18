import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pandarise",
  description:
    "Track daily tasks and progress across personal development categories.",
  manifest: "/manifest.json",
  icons: {
    icon: "/pandarise_icon_512.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">{children}</body>
    </html>
  );
}
