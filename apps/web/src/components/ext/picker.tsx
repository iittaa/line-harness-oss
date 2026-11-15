// このリポジトリ独自: 選ぶためのプルダウン。管理ツール（sns-worker の web/src/ui/parts.tsx の Picker）を移したもの。
// 素の <select> は開いた一覧がOS側の見た目になり、画面から浮くので使わない。
// 色は Harness の配色の決まり（gray-* を暗い画面で入れ替える。sns-theme.css）に合わせてある。
// 管理ツールと違い「全て」の行は任意（all を渡したときだけ出す）。複数選びは持たない。
import { useState } from 'react'

type Option = { value: string; label: string; n?: number }

function Chevron() {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-600">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export default function Picker({
  label,
  all,
  value,
  options,
  onChange,
}: {
  label: string
  all?: string
  value: string
  options: Option[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const picked = options.find((o) => o.value === value)
  const now = value ? (picked?.label ?? value) : (all ?? '')
  const close = () => {
    setOpen(false)
    setWord('')
  }
  const hasN = options.some((o) => typeof o.n === 'number')
  const allN = hasN ? options.reduce((sum, o) => sum + (o.n ?? 0), 0) : undefined
  const shown = word ? options.filter((o) => o.label.toLowerCase().includes(word.toLowerCase())) : options
  const rows: Option[] = [...(all !== undefined && !word ? [{ value: '', label: all, n: allN }] : []), ...shown]

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v)
          setWord('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close()
        }}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
          value ? 'border-sky-300 bg-sky-50 font-medium text-sky-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-800'
        }`}
      >
        {label}:<span>{now}</span>
        <Chevron />
      </button>

      {open && (
        <>
          {/* 外を押したら閉じる。画面全体に透明の敷物を置く */}
          <button type="button" aria-label="閉じる" className="fixed inset-0 z-10 cursor-default" onClick={close} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[200px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <label className="mx-1 mb-1 flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1">
              <SearchIcon />
              <input
                autoFocus
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') close()
                }}
                placeholder="名前で探す"
                className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400"
              />
            </label>
            <ul role="listbox" className="max-h-72 overflow-auto">
              {rows.map((o) => {
                const on = o.value === value
                return (
                  <li key={o.value || 'all'}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        onChange(o.value)
                        close()
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                        on ? 'bg-sky-50 text-sky-700' : 'text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <span className="min-w-0 truncate">{o.label}</span>
                      {typeof o.n === 'number' && <span className="ml-auto shrink-0 pl-2 text-gray-600">{o.n}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
