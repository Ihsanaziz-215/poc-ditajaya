import { STEPS } from '@/domain/derived'
import type { Role } from '@/domain/types'

export function Stepper({ step, role }: { step: { cur: number; stop?: boolean; warn?: boolean }; role: Role }) {
  const sales = role === 'Sales'
  const list = STEPS.map((x, i) => ({ x, i })).filter((o) => !(sales && o.i === 5))
  const cur = sales && step.cur === 5 ? 4 : step.cur
  return (
    <div className="steps" role="list">
      {list.map((o, pos) => {
        const i = o.i
        let c = ''
        if (step.cur === 8 || i < cur) c = 'done'
        else if (i === cur) c = step.stop ? 'stop' : step.warn ? 'warn' : 'cur'
        const lab = c === 'done' ? '✓' : c === 'stop' ? '✕' : pos + 1
        const nm = i === 3 && step.stop ? 'Batal' : o.x[0]
        return (
          <div key={i} className={`st ${c}`} role="listitem"><i>{lab}</i><b>{nm}</b><small>{o.x[1]}</small></div>
        )
      })}
    </div>
  )
}
