import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yeb-Ich - Track your calories with just a picture",
  description:
    "Meet Yeb-Ich, the AI-powered app for easy calorie tracking. Snap a photo, scan a barcode, or describe your meal and get instant calorie and nutrient info.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Story+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
