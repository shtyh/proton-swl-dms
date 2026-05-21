import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Users, Car, ClipboardList,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/leads', label: 'Inquiries', icon: ClipboardList },
  { path: '/customers', label: 'Customers', icon: Users },
]

export default function Layout({ children, session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [staff, setStaff] = useState(null)

  useEffect(() => {
    if (session?.user) {
      supabase.from('staff').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setStaff(data))
    }
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const roleLabel = {
    gm: 'General Manager', sm: 'Service Manager',
    sa: 'Sales Advisor', technician: 'Technician',
    parts: 'Parts Clerk', cashier: 'Cashier'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 fixed h-full z-20">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Proton SWL</p>
              <p className="text-xs text-gray-400">DMS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {staff?.full_name || session?.user?.email}
            </p>
            <p className="text-xs text-gray-400">{roleLabel[staff?.role] || 'Staff'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-gray-900">Proton SWL DMS</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl p-4" onClick={e => e.stopPropagation()}>
            <div className="mt-2 mb-4 px-2">
              <p className="font-medium text-gray-900">{staff?.full_name || session?.user?.email}</p>
              <p className="text-xs text-gray-400">{roleLabel[staff?.role] || 'Staff'}</p>
            </div>
            <nav className="space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path
                return (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setMobileOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                    <ChevronRight size={16} className="ml-auto text-gray-300" />
                  </button>
                )
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-500 mt-4"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
