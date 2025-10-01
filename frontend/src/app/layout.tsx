import "./globals.css";
import ConfirmProvider from "./components/ConfirmProvider";

export const metadata = {
  title: 'Vecole - AI Powered Learning',
  description: 'AI Powered Learning Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </body>
    </html>
  )
}
