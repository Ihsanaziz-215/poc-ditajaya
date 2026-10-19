import Link from 'next/link'

export function PageHead({ crumbs = [], title, children }: { crumbs?: [string, string?][]; title: string; children?: React.ReactNode }) {
  return (
    <div className="card">
      <div className="phead">
        <div>
          <div className="crumb">
            <Link href="/breakdown">Dashboard</Link>
            {crumbs.map((c, i) => (
              <span key={i}> / {c[1] ? <Link href={c[1]}>{c[0]}</Link> : c[0]}</span>
            ))}
          </div>
          <h1>{title}</h1>
        </div>
        <div className="acts">{children}</div>
      </div>
    </div>
  )
}
