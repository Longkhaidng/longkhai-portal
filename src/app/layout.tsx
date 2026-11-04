import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: 1200,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
};

export const metadata: Metadata = {
  title: "LONG KHẢI PORTAL - Cổng Thông Tin & Điều Hành Nhà Máy",
  description:
    "Cổng thông tin quản lý biểu mẫu điện tử, kiểm tra PCCC định kỳ, đơn nghỉ phép, xác nhận công, ra vào cổng và kiến trúc lưu trữ dữ liệu GitHub JSON cho nhà máy sản xuất.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className="h-full">
      <head>
        <meta name="viewport" content="width=1200, user-scalable=yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-w-[1200px] overflow-x-auto">
        {children}
      </body>
    </html>
  );
}
