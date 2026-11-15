// このリポジトリ独自: 地名霊視の受付（chimei-reception の送信側Worker）の読み取り口を呼ぶ。
// Harness本体を通さず、ブラウザから直接読む。閲覧の合言葉はこのブラウザにだけ覚えておく。
const BASE = 'https://chimei-reception-sender.kosuke-723723.workers.dev/view'
const KEY_NAME = 'chimei_view_key'

export class NeedKeyError extends Error {
  constructor() {
    super('閲覧の合言葉が必要です')
    this.name = 'NeedKeyError'
  }
}

export function getViewKey(): string {
  try {
    return localStorage.getItem(KEY_NAME) ?? ''
  } catch {
    return ''
  }
}

export function setViewKey(key: string): void {
  try {
    if (key) localStorage.setItem(KEY_NAME, key)
    else localStorage.removeItem(KEY_NAME)
  } catch {
    // 保存できないブラウザでは、その場かぎりになる
  }
}

export async function fetchChimei<T>(path: string): Promise<T> {
  const key = getViewKey()
  if (!key) throw new NeedKeyError()
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${key}` } })
  if (res.status === 401) {
    setViewKey('')
    throw new NeedKeyError()
  }
  if (!res.ok) throw new Error(`chimei view ${res.status}`)
  const body = (await res.json()) as { data: T }
  return body.data
}
