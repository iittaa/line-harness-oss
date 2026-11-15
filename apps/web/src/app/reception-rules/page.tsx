'use client'

// このリポジトリ独自: 地名霊視の受付（chimei-reception）の自動対応ルールと、
// Discordで出した返事の案・人が実際に送った文（ナレッジ）を読むページ。読むだけ。
import { useEffect, useState } from 'react'
import Header from '@/components/layout/header'
import MarkdownView from '@/components/ext/markdown-view'
import ViewKeyForm from '@/components/ext/view-key-form'
import { fetchChimei, NeedKeyError } from '@/lib/chimei-view'
import { Banner } from '@cloudflare/kumo/components/banner'
import { Empty } from '@cloudflare/kumo/components/empty'
import { LayerCard } from '@cloudflare/kumo/components/layer-card'
import { Loader } from '@cloudflare/kumo/components/loader'

type Knowledge = {
  id: string
  account: string
  displayName: string
  question: string | null
  draft: string
  status: string
  sent: string | null
  createdAt: string
}

const STATUS: Record<string, string> = {
  open: '未対応',
  sending: '送信中',
  sent: '送った',
  skipped: '自分で返した',
}

function Section({ label, text, muted }: { label: string; text: string; muted?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-gray-600">{label}</div>
      <div className={`whitespace-pre-wrap break-words rounded-md p-2.5 text-sm ${muted ? 'bg-gray-50 text-gray-600' : 'bg-gray-100'}`}>{text}</div>
    </div>
  )
}

export default function ReceptionRulesPage() {
  const [tab, setTab] = useState<'rules' | 'knowledge'>('rules')
  const [rules, setRules] = useState<string | null>(null)
  const [items, setItems] = useState<Knowledge[] | null>(null)
  const [error, setError] = useState('')
  const [needKey, setNeedKey] = useState(false)
  const [keyFailed, setKeyFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    setNeedKey(false)
    setError('')
    const fail = (what: string) => (e: unknown) => {
      if (e instanceof NeedKeyError) {
        setKeyFailed(reload > 0)
        setNeedKey(true)
      } else setError(`${what}を取得できませんでした`)
    }
    fetchChimei<{ text: string }>('/rules').then((d) => setRules(d.text)).catch(fail('ルール'))
    fetchChimei<Knowledge[]>('/knowledge').then(setItems).catch(fail('ナレッジ'))
  }, [reload])

  const sentCount = items?.filter((k) => k.status === 'sent').length ?? 0

  return (
    <div className="space-y-6">
      <Header
        title="自動対応ルール"
        description="地名霊視の公式LINEの自動対応の決まりと、人が返した文のたまり（ナレッジ）を読むページです。ルールの正本は受付のコードとVaultの文書で、ここは配備のときの写しです。"
      />

      {needKey ? (
        <ViewKeyForm failed={keyFailed} onSaved={() => setReload((n) => n + 1)} />
      ) : (
      <>
      <div className="flex gap-1.5">
        {([
          ['rules', 'ルール'],
          ['knowledge', `ナレッジ${items ? `（${items.length}件・送った${sentCount}件）` : ''}`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full border px-3 py-1 text-sm ${tab === key ? 'border-transparent bg-sky-600 text-white' : 'border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Banner variant="error" title={error} description="時間をおいて再度お試しください。" />}

      {tab === 'rules' ? (
        <LayerCard className="p-5 sm:p-6">
          {rules === null ? <Loader className="mx-auto" /> : <MarkdownView text={rules} />}
        </LayerCard>
      ) : items === null ? (
        <LayerCard className="p-8"><Loader className="mx-auto" /></LayerCard>
      ) : items.length === 0 ? (
        <Empty title="まだありません" description="AIが人に任せた文に、Discordから返事をするとたまっていきます。" />
      ) : (
        <div className="space-y-3">
          {items.map((k) => (
            <LayerCard key={k.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="rounded bg-gray-200 px-1.5 py-0.5 font-semibold text-gray-800">{k.account}</span>
                <span>{k.displayName}</span>
                <span>{k.createdAt}</span>
                <span className="ml-auto">{STATUS[k.status] ?? k.status}</span>
              </div>
              {k.question && <Section label="お客の文" text={k.question} />}
              <Section label="AIの案" text={k.draft || '（案なし）'} muted={Boolean(k.sent)} />
              {k.sent && <Section label="実際に送った文" text={k.sent} />}
            </LayerCard>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  )
}
