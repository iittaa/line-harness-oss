import { useCallback, useRef } from 'react'

/**
 * 同じ一覧の読み込みが重なったとき、古い応答で画面を上書きしないための印。
 * 読み込みの先頭で begin() を呼び、await の後に返り値の関数で最新か確かめる。
 */
export function useLatestRequest(): () => () => boolean {
  const latest = useRef(0)
  return useCallback(() => {
    const id = ++latest.current
    return () => id === latest.current
  }, [])
}
