/**
 * ライト／ダークの最初の判定。**画面が描かれる前に <html> へ印を付ける。**
 * layout.tsx の <head> に埋め込んで使う（ボタン側は sns-theme-toggle.tsx）。
 *
 * 'use client' の部品から文字列を受け渡すと、サーバー側で中身を読めない
 * ことがあるので、このファイルに分けてある。
 */

export const THEME_KEY = 'sw-theme'

export const THEME_BOOT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.setAttribute('data-sw-theme','dark')}catch(e){}})()`
