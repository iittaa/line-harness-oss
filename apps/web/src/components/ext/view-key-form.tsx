// このリポジトリ独自: カルテ・自動対応ルールのページで、閲覧の合言葉を入れてもらう欄。
import { useState } from 'react'
import { LayerCard } from '@cloudflare/kumo/components/layer-card'
import { setViewKey } from '@/lib/chimei-view'

export default function ViewKeyForm({ onSaved, failed }: { onSaved: () => void; failed?: boolean }) {
  const [value, setValue] = useState('')
  return (
    <LayerCard className="max-w-md space-y-3 p-5">
      <div className="font-semibold">閲覧の合言葉を入れてください</div>
      <p className="text-sm text-gray-600">
        カルテには相談者の個人情報が入るため、Harnessのログインとは別に合言葉で守っています。このブラウザには一度入れれば覚えておきます。
      </p>
      {failed && <p className="text-sm text-red-600">合言葉が違うか、期限切れです。</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!value.trim()) return
          setViewKey(value.trim())
          onSaved()
        }}
      >
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-transparent px-2 py-1.5 text-sm"
        />
        <button type="submit" className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white">
          開く
        </button>
      </form>
    </LayerCard>
  )
}
