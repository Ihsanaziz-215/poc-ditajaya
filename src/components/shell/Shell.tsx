import { Icon } from '@/components/ui/Icon'
import type { Notif, Role } from '@/domain/types'
import { AssumptionsButton } from './AssumptionsModal'
import { Bell } from './Bell'
import type { BellNotif } from './Bell'
import { ResetButton, UserMenu } from './UserMenu'
import { ProfileMenu } from './ProfileMenu'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

export function Shell({ role, notifs, children }: { role: Role; notifs: Notif[]; children: React.ReactNode }) {
  const mine: BellNotif[] = notifs
    .filter((n) => n.roles.includes(role))
    .sort((a, b) => b.t - a.t)
    .slice(0, 12)
    .map((n) => ({ id: n.id, text: n.text, t: n.t, unread: !n.read[role], href: n.link || `/breakdown/${n.fid}` }))
  const unreadCount = notifs.filter((n) => n.roles.includes(role) && !n.read[role]).length
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <header className="top">
          <div className="spill">
            <Icon name="search" />
            <input placeholder="Search" aria-label="Search global" />
          </div>
          <div className="sp" />
          <div className="demo">
            <small>Demo · tab role</small>
            <UserMenu role={role} />
            <ResetButton />
            <AssumptionsButton />
          </div>
          <Bell role={role} notifs={mine} unreadCount={unreadCount} />
          <ThemeToggle />
          <ProfileMenu role={role} />
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  )
}
