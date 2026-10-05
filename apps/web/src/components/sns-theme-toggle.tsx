'use client'

/**
 * ライト（LINE Harness の元の見た目）とダーク（sns-worker にそろえた配色）の切り替え。
 * **このリポジトリ独自の部品。**色の中身は app/sns-theme.css にある。
 *
 * 選んだほうは localStorage に覚えておく。覚えていなければ Mac の設定に合わせる。
 * 開いた瞬間に白く光らないよう、最初の判定は layout.tsx の <head> の中で済ませてある
 * （sns-theme-boot.ts）。ここはボタンを押したときの切り替えだけを受け持つ。
 */

import { useEffect, useState } from 'react'
import { THEME_KEY as KEY } from './sns-theme-boot'

export default function SnsThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null)

  // **描き終わったあとにもう一度付け直す。**<head> で付けた印が、React の
  // 描き直しで <html> から外れることがあるため（2026-10-05に手元で確認）
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(KEY)
    } catch {
      // 読めない環境では Mac の設定に合わせる
    }
    const isDark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) document.documentElement.setAttribute('data-sw-theme', 'dark')
    else document.documentElement.removeAttribute('data-sw-theme')
    setDark(isDark)
  }, [])

  if (dark === null) return null

  const flip = () => {
    const next = !dark
    if (next) document.documentElement.setAttribute('data-sw-theme', 'dark')
    else document.documentElement.removeAttribute('data-sw-theme')
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      // 保存できない環境（プライベートウィンドウ等）では、その場の切り替えだけ効く
    }
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={dark ? 'ライトモードにする' : 'ダークモードにする'}
      title={dark ? 'ライトモードにする' : 'ダークモードにする'}
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md transition-colors hover:text-gray-900"
    >
      {dark ? (
        // 太陽（押すとライトへ）
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // 月（押すとダークへ）
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
