// このリポジトリ独自: カルテやルールの文書（Markdown）を読むための小さな表示部品。
// お客の書いた文が入るので、HTMLとして差し込まず、すべてReactの要素として組み立てる。
// 見出し・箇条書き・番号付き・表・コード・引用・太字・インラインコード・リンクだけ扱う。
// 先頭の「--- 欄: 値 ---」は出さない（カルテのページが別に整えて出す）。
import { Fragment, type ReactNode } from 'react'

type Item = { mark: string; lines: string[] }
type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'list'; ordered: boolean; items: Item[] }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'p'; lines: string[] }
  | { kind: 'hr' }

const BULLET = /^\s*([-*])\s+(.*)$/
const NUMBER = /^\s*(\d+)[.)]\s+(.*)$/
const STARTS_BLOCK = /^(#{1,6}\s|>|`{3}|\s*\||\s*(-{3,}|\*{3,})\s*$)/

export function stripFront(src: string): string {
  return src.replace(/^---\n[\s\S]*?\n---\n?/, '')
}

export function parseBlocks(src: string): Block[] {
  const lines = stripFront(src.replace(/\r\n/g, '\n')).split('\n')
  const out: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = line.match(/^(`{3,})/)
    if (fence) {
      const body: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith(fence[1])) body.push(lines[i++])
      i++
      out.push({ kind: 'code', text: body.join('\n') })
      continue
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      out.push({ kind: 'h', level: h[1].length, text: h[2] })
      i++
      continue
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push({ kind: 'hr' })
      i++
      continue
    }
    if (line.startsWith('>')) {
      const q: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''))
      out.push({ kind: 'quote', lines: q })
      continue
    }
    if (/^\s*\|/.test(line)) {
      const rows: string[][] = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells)
        i++
      }
      out.push({ kind: 'table', rows })
      continue
    }
    if (BULLET.test(line) || NUMBER.test(line)) {
      const ordered = NUMBER.test(line)
      const marker = ordered ? NUMBER : BULLET
      const items: Item[] = []
      while (i < lines.length) {
        const m = lines[i].match(marker)
        if (m) {
          items.push({ mark: m[1], lines: [m[2]] })
          i++
          continue
        }
        // 番号や記号の無い次の行は、直前の項目の続きとして読む（空き行・別の種類の行で終わる）
        const l = lines[i]
        if (!l.trim() || STARTS_BLOCK.test(l) || BULLET.test(l) || NUMBER.test(l)) break
        items[items.length - 1].lines.push(l.trim())
        i++
      }
      out.push({ kind: 'list', ordered, items })
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const p: string[] = []
    while (i < lines.length && lines[i].trim() && !STARTS_BLOCK.test(lines[i]) && !BULLET.test(lines[i]) && !NUMBER.test(lines[i])) {
      p.push(lines[i++])
    }
    if (p.length === 0) p.push(lines[i++])
    out.push({ kind: 'p', lines: p })
  }
  return out
}

// 太字・インラインコード・リンク・[[wikilink]] を要素にする。それ以外は文字のまま
function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)）」]+)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('**')) nodes.push(<strong key={k++} className="font-semibold">{t.slice(2, -2)}</strong>)
    else if (t.startsWith('`')) nodes.push(<code key={k++} className="rounded bg-gray-100 px-1.5 py-0.5 text-[0.9em]">{t.slice(1, -1)}</code>)
    else if (t.startsWith('[[')) nodes.push(<span key={k++} className="text-sky-700">{t.slice(2, -2).split('|').pop()}</span>)
    else if (t.startsWith('[')) {
      const mm = t.match(/^\[([^\]]+)\]\((.+)\)$/)!
      nodes.push(<a key={k++} href={mm[2]} target="_blank" rel="noreferrer" className="text-sky-700 underline underline-offset-2">{mm[1]}</a>)
    } else nodes.push(<a key={k++} href={t} target="_blank" rel="noreferrer" className="break-all text-sky-700 underline underline-offset-2">{t}</a>)
    last = m.index + t.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

const Muted = ({ children }: { children: ReactNode }) => (
  <span className="text-gray-600">{children}</span>
)

// 「本音: 〇〇」のような項目は、欄の名前を薄く、空なら「未記入」と出す
function labeled(text: string): ReactNode {
  const m = text.match(/^([^:：]{1,24})[:：]\s*(.*)$/)
  if (!m || /^https?$/.test(m[1])) return inline(text)
  return (
    <>
      <span className="text-gray-600">{m[1]}</span>
      <span className="text-gray-500">：</span>
      {m[2] ? inline(m[2]) : <Muted>未記入</Muted>}
    </>
  )
}

function itemBody(item: Item): ReactNode {
  return item.lines.map((l, j) => (
    <Fragment key={j}>
      {j > 0 && <br />}
      {j === 0 ? labeled(l) : inline(l)}
    </Fragment>
  ))
}

function heading(level: number, text: string, key: number): ReactNode {
  if (level <= 1) return <h2 key={key} className="text-xl font-bold tracking-tight">{inline(text)}</h2>
  if (level === 2)
    return (
      <h3 key={key} className="mt-8 flex items-center gap-2 border-b border-gray-200 pb-2 text-[15px] font-bold first:mt-0">
        <span className="h-4 w-1 rounded-full bg-sky-50" />
        {inline(text)}
      </h3>
    )
  return <h4 key={key} className="mt-5 text-sm font-bold text-gray-800">{inline(text)}</h4>
}

export default function MarkdownView({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  return (
    <div className="max-w-3xl space-y-3 text-[14px] leading-7 text-gray-800">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'h': {
            // 中身の無い節には「まだありません」と添える
            const next = blocks[i + 1]
            const empty = b.level >= 2 && (!next || (next.kind === 'h' && next.level <= b.level))
            return (
              <Fragment key={i}>
                {heading(b.level, b.text, i)}
                {empty && <p className="text-sm"><Muted>まだありません</Muted></p>}
              </Fragment>
            )
          }
          case 'hr':
            return <hr key={i} className="my-6 border-gray-200" />
          case 'code':
            return (
              <pre key={i} className="whitespace-pre-wrap break-words rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 font-sans text-[13.5px] leading-7">
                {b.text}
              </pre>
            )
          case 'quote':
            return (
              <blockquote key={i} className="rounded-r-md border-l-[3px] border-sky-300 bg-sky-50 px-3 py-2 text-[13px] text-gray-700">
                {b.lines.map((l, j) => <div key={j}>{inline(l)}</div>)}
              </blockquote>
            )
          case 'list':
            return (
              <ul key={i} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className={`shrink-0 text-right text-gray-600 tabular-nums ${b.ordered ? 'w-5' : 'w-3'}`}>
                      {b.ordered ? `${it.mark}.` : '•'}
                    </span>
                    <div className="min-w-0 flex-1">{itemBody(it)}</div>
                  </li>
                ))}
              </ul>
            )
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-left text-[13px] leading-6">
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className={j === 0 ? 'bg-gray-50 font-semibold' : 'border-t border-gray-100'}>
                        {r.map((c, k) => <td key={k} className="px-3 py-1.5 align-top">{inline(c)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'p':
            return <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>
        }
      })}
    </div>
  )
}
