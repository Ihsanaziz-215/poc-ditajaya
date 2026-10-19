'use client'

import { useState } from 'react'
import { RoleBadge } from '@/components/ui/Badge'
import { useAction } from '@/components/ui/Providers'
import type { Comment, Role } from '@/domain/types'
import { fdt } from '@/lib/format'
import { addCommentAction } from '@/server/actions/shared'

export function CommentsCard({ fid, comments, role }: { fid: string; comments: Comment[]; role: Role }) {
  const { run, pending } = useAction()
  const [text, setText] = useState('')
  return (
    <div className="card">
      <h3>Comment</h3>
      <p className="sub">Komunikasi antar role tetap di dalam form. Aktif di semua tahap.</p>
      <div className="cm">
        {comments.length ? (
          comments.map((c, k) => (
            <div key={k} className="cmi">
              <small><RoleBadge r={c.role} /> <b style={{ color: 'var(--text)' }}>{c.user}</b> · {fdt(c.t)}</small>
              <p>{c.text}</p>
            </div>
          ))
        ) : (
          <div className="empty" style={{ padding: 12 }}>Belum ada comment.</div>
        )}
      </div>
      <textarea style={{ minHeight: 64 }} placeholder="Tulis comment untuk role lain" aria-label="Comment" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="acts" style={{ marginTop: 10 }}>
        <button
          className="btn sm"
          disabled={pending}
          onClick={async () => {
            if (!text.trim()) return
            const r = await run(addCommentAction(fid, text, role))
            if (r.ok) setText('')
          }}
        >
          Kirim comment
        </button>
      </div>
    </div>
  )
}
