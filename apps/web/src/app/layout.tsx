import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/app-shell'
// ライト／ダークの切り替え（このリポジトリ独自。色は sns-theme.css）
import SnsThemeToggle from '@/components/sns-theme-toggle'
import { THEME_BOOT } from '@/components/sns-theme-boot'

export const metadata: Metadata = {
  title: 'L Harness',
  description: 'L Harness 管理画面',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased" style={{ fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', system-ui, sans-serif" }}>
        <AppShell>
          {children}
        </AppShell>
        <SnsThemeToggle />
      </body>
    </html>
  )
}
