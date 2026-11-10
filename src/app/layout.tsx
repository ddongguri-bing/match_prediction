import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "대유잼 LG 승부 예측",
  description: "대유잼 LG 승부 예측",
  openGraph: {
    title: "대유잼 LG 승부 예측",
    description: "대유잼 LG 승부 예측",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "대유잼 LG 승부 예측",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "대유잼 LG 승부 예측",
    description: "대유잼 LG 승부 예측",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        <style>{`
          html, body, * {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          html::-webkit-scrollbar,
          body::-webkit-scrollbar,
          *::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
