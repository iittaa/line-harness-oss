'use client'

// このリポジトリ独自: 占いのカルテ（非公開リポジトリ uranai-crm）を読むページ。
// 中身は地名霊視の受付（chimei-reception）から閲覧の合言葉つきで直接読む。読むだけで書き換えない。
// トーク履歴は個別チャットで見られるので、ここには出さない。
import { useEffect, useMemo, useState } from 'react'
import Header from '@/components/layout/header'
import MarkdownView from '@/components/ext/markdown-view'
import Picker from '@/components/ext/picker'
import ViewKeyForm from '@/components/ext/view-key-form'
import { fetchChimei, NeedKeyError } from '@/lib/chimei-view'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Empty } from '@cloudflare/kumo/components/empty'
import { LayerCard } from '@cloudflare/kumo/components/layer-card'
import { Loader } from '@cloudflare/kumo/components/loader'

type Person = { folder: string; name: string; files: string[]; meta?: Record<string, string> }
type Character = { name: string; people: Person[] }

// カルテの状態の順（uranai-crm の README）。途中で止まったものは別の色
const STEPS: { field: string; label: string }[] = [
  { field: '相談受信', label: '相談' },
  { field: '受け取り送信', label: '受け取り' },
  { field: '無料鑑定送信', label: '無料鑑定' },
  { field: '本鑑定希望', label: '本鑑定希望' },
  { field: '購入', label: '購入' },
  { field: '答え受信', label: '答え' },
  { field: '鑑定書送信', label: '鑑定書' },
]
const STOPPED = ['終了', '返事なし', 'ブロック']

// 先頭に出すので本文の欄からは外すもの
const FACTS = ['生年月日', '性別', '相談の種類', '流入元', 'プラン', '金額', 'LINE表示名', '無料鑑定の型の版']

function parseFront(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  const out: Record<string, string> = {}
  for (const line of m?.[1].split('\n') ?? []) {
    const i = line.indexOf(':')
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return out
}

function stateTone(state?: string): string {
  if (!state) return 'bg-gray-100 text-gray-600'
  if (STOPPED.includes(state)) return 'bg-gray-100 text-gray-600'
  if (state.includes('購入') || state.includes('鑑定書')) return 'bg-emerald-50 text-emerald-700'
  if (state.includes('本鑑定')) return 'bg-amber-50 text-amber-700'
  return 'bg-sky-50 text-sky-700'
}

function StateBadge({ state }: { state?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${stateTone(state)}`}>
      {state || '状態なし'}
    </span>
  )
}

// 0001_あさみ → { num: 0001, name: あさみ }
function splitName(name: string): { num: string; name: string } {
  const m = name.match(/^(\d{4})_(.*)$/)
  return m ? { num: m[1], name: m[2] } : { num: '', name }
}

// 2026-11-11 20:48 → 11/11 20:48
function shortDate(v?: string): string {
  const m = v?.match(/^\d{4}-(\d{2})-(\d{2})(?:\s+(\d{2}:\d{2}))?/)
  return m ? `${Number(m[1])}/${Number(m[2])}${m[3] ? ` ${m[3]}` : ''}` : v ?? ''
}

function fileLabel(path: string, folder: string): string {
  return path.slice(folder.length + 1).replace(/^鑑定\//, '').replace(/\.md$/, '')
}

function Summary({ front }: { front: Record<string, string> }) {
  const facts = FACTS.filter((k) => front[k])
  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-lg font-bold">{front['呼び方'] || '（呼び方なし）'}</div>
        <StateBadge state={front['状態']} />
        {front['id'] && <span className="text-xs text-gray-600 tabular-nums">No.{front['id']}</span>}
      </div>

      {front['次にやること'] && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-[11px] font-semibold text-amber-700">次にやること</div>
          <div className="mt-0.5 text-sm font-medium">{front['次にやること']}</div>
        </div>
      )}

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {STEPS.map((s) => {
          const done = Boolean(front[s.field])
          return (
            <li
              key={s.field}
              className={`rounded-lg border px-3 py-2 ${done ? 'border-sky-200 bg-sky-50' : 'border-dashed border-gray-200'}`}
            >
              <div className={`text-[11px] font-semibold ${done ? 'text-sky-700' : 'text-gray-600'}`}>{s.label}</div>
              <div className={`mt-0.5 text-xs tabular-nums ${done ? '' : 'text-gray-500'}`}>{done ? shortDate(front[s.field]) : '—'}</div>
            </li>
          )
        })}
      </ol>

      {facts.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {facts.map((k) => (
            <div key={k} className="flex gap-3">
              <dt className="w-24 shrink-0 text-gray-600">{k}</dt>
              <dd className="min-w-0 break-words">{front[k]}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default function KartePage() {
  const [chars, setChars] = useState<Character[] | null>(null)
  const [error, setError] = useState('')
  const [charName, setCharName] = useState('')
  const [folder, setFolder] = useState('')
  const [file, setFile] = useState('')
  const [text, setText] = useState<string | null>(null)
  const [fileError, setFileError] = useState('')
  const [needKey, setNeedKey] = useState(false)
  const [keyFailed, setKeyFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    setNeedKey(false)
    setError('')
    fetchChimei<Character[]>('/karte')
      .then((data) => {
        setChars(data)
        setCharName((cur) => cur || data[0]?.name || '')
      })
      .catch((e) => {
        if (e instanceof NeedKeyError) {
          setKeyFailed(reload > 0)
          setNeedKey(true)
        } else setError('カルテの一覧を取得できませんでした')
      })
  }, [reload])

  const char = useMemo(() => chars?.find((c) => c.name === charName), [chars, charName])
  const person = useMemo(() => char?.people.find((p) => p.folder === folder), [char, folder])

  useEffect(() => {
    if (!file) return
    setText(null)
    setFileError('')
    fetchChimei<{ text: string }>(`/file?path=${encodeURIComponent(file)}`)
      .then((data) => setText(data.text))
      .catch((e) => {
        if (e instanceof NeedKeyError) setNeedKey(true)
        else setFileError('ファイルを取得できませんでした')
      })
  }, [file])

  const openPerson = (p: Person) => {
    setFolder(p.folder)
    setFile(p.files[0] ?? '')
  }

  const isKarte = file.endsWith('/カルテ.md')
  const front = useMemo(() => (text && isKarte ? parseFront(text) : null), [text, isKarte])

  return (
    <div className="space-y-6">
      <Header title="カルテ" description="お客ごとのカルテと鑑定文（uranai-crm）を読むページです。書き換えはできません。" />

      {needKey ? (
        <ViewKeyForm failed={keyFailed} onSaved={() => setReload((n) => n + 1)} />
      ) : error ? (
        <Banner variant="error" title={error} description="時間をおいて再度お試しください。" />
      ) : !chars ? (
        <LayerCard className="p-8"><Loader className="mx-auto" /></LayerCard>
      ) : chars.length === 0 ? (
        <Empty title="カルテはまだありません" />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* はみ出しを隠さない。キャラのプルダウンが枠の外まで開くため */}
          <LayerCard className="p-0 lg:sticky lg:top-4">
            <div className="border-b border-gray-200 p-3">
              <Picker
                label="キャラ"
                value={charName}
                options={chars.map((c) => ({ value: c.name, label: c.name, n: c.people.length }))}
                onChange={(v) => { setCharName(v); setFolder(''); setFile('') }}
              />
            </div>
            <ul className="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto">
              {char?.people.map((p) => {
                const n = splitName(p.name)
                const active = p.folder === folder
                return (
                  <li key={p.folder}>
                    <button
                      type="button"
                      onClick={() => openPerson(p)}
                      className={`block w-full px-4 py-3 text-left transition-colors ${active ? 'bg-sky-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`truncate text-sm ${active ? 'font-bold' : 'font-medium'}`}>{p.meta?.['呼び方'] || n.name}</span>
                        <span className="text-[11px] text-gray-600 tabular-nums">{n.num}</span>
                        <span className="ml-auto"><StateBadge state={p.meta?.['状態']} /></span>
                      </div>
                      <div className="mt-1 flex gap-2 text-[11px] text-gray-600">
                        {p.meta?.['相談受信'] && <span className="shrink-0 tabular-nums">相談 {shortDate(p.meta['相談受信'])}</span>}
                        {p.meta?.['次にやること'] && <span className="truncate">→ {p.meta['次にやること']}</span>}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </LayerCard>

          <LayerCard className="min-w-0 p-5 sm:p-6">
            {!person ? (
              <div className="py-16 text-center text-sm text-gray-600">左の一覧からお客を選んでください。</div>
            ) : (
              <div className="space-y-6">
                {person.files.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {person.files.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFile(f)}
                        className={`rounded-full border px-3.5 py-1 text-xs transition-colors ${f === file ? 'border-transparent bg-sky-600 text-white' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        {fileLabel(f, person.folder)}
                      </button>
                    ))}
                  </div>
                )}
                {fileError ? (
                  <Banner variant="error" title={fileError} />
                ) : text === null ? (
                  <Loader className="mx-auto" />
                ) : (
                  <>
                    {front && <Summary front={front} />}
                    <MarkdownView text={text} />
                  </>
                )}
              </div>
            )}
          </LayerCard>
        </div>
      )}
    </div>
  )
}
