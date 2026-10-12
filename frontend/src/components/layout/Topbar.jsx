import { Bell, ChevronDown, LogOut, Menu, Search, User, X } from '../../lib/icons.jsx'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { getRoleDisplayName } from '../../utils/roleUtils'
import { api } from '../../lib/api'

// Debounce utility function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const unread = useAppStore(state => state.notificationUnreadCount)

  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [searchResults, setSearchResults] = useState({ projects: [], customers: [], users: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const searchRef = useRef(null)
  const menuRef = useRef(null)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ projects: [], customers: [], users: [] })
        setIsSearching(false)
        return
      }

      try {
        setIsSearching(true)
        const results = await api.search(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults({ projects: [], customers: [], users: [] })
      } finally {
        setIsSearching(false)
      }
    }, 300),
    []
  )

  // Trigger search when query changes
  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowResults(false)
      if (!menuRef.current?.contains(e.target)) setShowMenu(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { setShowMenu(false); setShowResults(false) }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const hasResults = (searchResults?.projects?.length || 0) > 0 || 
                    (searchResults?.customers?.length || 0) > 0 || 
                    (searchResults?.users?.length || 0) > 0

  const handleSelect = (path) => {
    navigate(path)
    setQuery('')
    setShowResults(false)
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await api.logout()
    } catch (error) {
      console.warn('Logout API error:', error)
    } finally {
      logout()
      navigate('/login', { replace: true })
      setIsLoggingOut(false)
      setShowLogoutConfirm(false)
    }
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

      {/* Search */}
      <div className="relative min-w-0 flex-1 lg:max-w-md" ref={searchRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)}
          placeholder="Cari proyek, customer, user…"
          aria-label="Pencarian global"
          className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        {query && (
          <button onClick={() => { setQuery(''); setShowResults(false) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}

        {/* Dropdown results */}
        {showResults && query.trim().length >= 2 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            {isSearching ? (
              <p className="text-xs text-gray-400 px-4 py-3">Mencari...</p>
            ) : !hasResults ? (
              <p className="text-xs text-gray-400 px-4 py-3">Tidak ada hasil untuk "{query}"</p>
            ) : (
              <>
                {(searchResults?.projects?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Proyek</p>
                    {searchResults.projects.map(p => (
                      <button key={p.id} onClick={() => handleSelect(p.url)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
                {(searchResults?.customers?.length || 0) > 0 && (
                  <div className="border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Customers</p>
                    {searchResults.customers.map(c => (
                      <button key={c.id} onClick={() => handleSelect(c.url)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.subtitle}</p>
                      </button>
                    ))}
                  </div>
                )}
                {(searchResults?.users?.length || 0) > 0 && (
                  <div className="border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 px-4 pt-3 pb-1 uppercase tracking-wide">Users</p>
                    {searchResults.users.map(u => (
                      <button key={u.id} onClick={() => handleSelect(u.url)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.subtitle} - {u.role}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(open => !open)}
              className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={showMenu}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 text-left md:block">
                <span className="block max-w-[160px] truncate text-sm font-medium leading-tight text-gray-900">{user?.name}</span>
                <span className="block text-xs leading-tight text-gray-500">{getRoleDisplayName(user?.role)}</span>
              </span>
              <ChevronDown size={16} className="hidden text-gray-400 md:block" />
            </button>

            {showMenu && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="truncate text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => { setShowMenu(false); navigate('/profile') }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={16} className="text-gray-400" />
                  Profil Saya
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => { setShowMenu(false); setShowLogoutConfirm(true) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <LogOut size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Yakin ingin keluar?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Sesi Anda akan ditutup dan Anda perlu login ulang untuk masuk ke dashboard.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                <LogOut size={15} />
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

