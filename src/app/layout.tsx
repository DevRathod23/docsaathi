import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'DocSaathi | AI Companion for Documents',
  description: 'The AI companion for your legal and medical documents. Decipher complexity with clinical precision and absolute privacy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-screen selection:bg-primary/30 selection:text-primary-light">
        {children}
      </body>
    </html>
  )
}

