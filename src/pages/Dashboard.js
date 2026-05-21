import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TrendingUp, Users, Car, AlertCircle, Plus, ChevronRight, Flame, Thermometer, Snowflake } from 'lucide-react'

const priorityIcon = { hot: <Flame size={14} className="text-red-500" />, warm: <Thermometer size={14} className="text-orange-400" />, cold: <Snowflake size={14} className="text-blue-400" /> }
const statusColor = {
  new: 'bg-blue-100 text-blue-700', following: 'bg-yellow-100 text-yellow-700',
  test_drive: 'bg-purple-100 text-purple-700', negotiating: 'bg-orange-100 text-orange-700',
  booked: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-700'
}
const statusLabel = {
  new: 'New', following: 'Following', test_drive: 'Test Drive',
  negotiating: 'Negotiating', booked: 'Booked', delivered: 'Delivered', lost: 'Lost'
}

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, hot: 0, booked: 0, overdue: 0 })
  const [todayFollowups, setTodayFollowups] = useState([])
  const [recentLeads, setRecentLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const [leadsRes, followRes, recentRes] = await Promise.all([
      supabase.from('leads').select('status, priority, next_followup').neq('status', 'lost').neq('status', 'delivered'),
      supabase.from('leads').select(`
        id, status, priority, next_followup,
        customers(full_name, phone),
        car_models(name)
      `).eq('next_followup', today).neq('status', 'lost'),
      supabase.from('leads').select(`
        id, status, priority, created_at,
        customers(full_name),
        car_models(name)
      `).order('created_at', { ascending: false }).limit(5)
    ])

    const leads = leadsRes.data || []
    const overdueCount = leads.filter(l => l.next_followup && l.next_followup < today).length

    setStats({
      total: leads.length,
      hot: leads.filter(l => l.priority === 'hot').length,
      booked: leads.filter(l => l.status === 'booked').length,
      overdue: overdueCount
    })
    setTodayFollowups(followRes.data || [])
    setRecentLeads(recentRes.data || [])
    setLoading(false)
  }

  const kpis = [
    { label: 'Active Leads', value: stats.total, icon: Users, color: 'bg-blue-50 text-blue-600', change: 'Total open inquiries' },
    { label: 'Hot Leads', value: stats.hot, icon: Flame, color: 'bg-red-50 text-red-600', change: 'High priority' },
    { label: 'Booked', value: stats.booked, icon: Car, color: 'bg-green-50 text-green-600', change: 'This month' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'bg-orange-50 text-orange-600', change: 'Need follow-up' },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button
          onClick={() => navigate('/leads/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Lead</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '–' : value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{change}</p>
          </div>
        ))}
      </div>

      {/* Today's Follow-ups */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Today's Follow-ups</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {todayFollowups.length}
          </span>
        </div>
        {todayFollowups.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            {loading ? 'Loading...' : '✓ No follow-ups scheduled for today'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {todayFollowups.map(lead => (
              <button
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-600">
                    {lead.customers?.full_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.customers?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{lead.car_models?.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {priorityIcon[lead.priority]}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[lead.status]}`}>
                    {statusLabel[lead.status]}
                  </span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Inquiries</h2>
          <button onClick={() => navigate('/leads')} className="text-blue-600 text-sm font-medium">View all</button>
        </div>
        {recentLeads.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            {loading ? 'Loading...' : 'No leads yet. Add your first one!'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLeads.map(lead => (
              <button
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-600">
                    {lead.customers?.full_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lead.customers?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{lead.car_models?.name || 'No model selected'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {priorityIcon[lead.priority]}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[lead.status]}`}>
                    {statusLabel[lead.status]}
                  </span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
