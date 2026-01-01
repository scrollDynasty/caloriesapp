import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yeb-Ich - Отслеживайте калории одним снимком",
  description:
    "Знакомьтесь с Yeb-Ich — приложением на базе искусственного интеллекта для простого подсчёта калорий. Сделайте фото, отсканируйте штрихкод или опишите блюдо и получите мгновенную информацию о калориях и питательных веществах.",
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
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Story+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
