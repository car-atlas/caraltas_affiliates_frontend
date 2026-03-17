"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Car, BarChart3, Settings, Users, Wallet, X } from "lucide-react"

interface AgencySidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AgencySidebar({ mobileOpen, onClose }: AgencySidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { href: "/agency/dashboard", label: "Dashboard", icon: Home },
    { href: "/agency/listings", label: "Listings", icon: Car },
    { href: "/agency/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/agency/wallet", label: "Wallet & Bills", icon: Wallet },
    { href: "/agency/team", label: "Team", icon: Users },
    { href: "/agency/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transform bg-card shadow-xl transition-transform duration-200 ease-out
          md:static md:z-auto md:h-full md:w-64 md:flex-shrink-0 md:transform-none md:border-r md:border-border md:shadow-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-4 md:border-0 md:py-0 md:pb-4">
            <span className="text-sm font-medium text-muted-foreground md:hidden">Menu</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-4 md:overflow-y-visible">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base transition-colors active:bg-muted ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-card-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={22} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
