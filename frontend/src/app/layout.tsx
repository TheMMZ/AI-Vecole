export const metadata = {
  title: 'Vecole - AI Powered Learning',
  description: 'AI Powered Learning Platform',
}

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
