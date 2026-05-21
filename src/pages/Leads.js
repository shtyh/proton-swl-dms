import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Plus, Search, Filter, Flame, Thermometer, Snowflake, ChevronRight } from 'lucide-react'

const statusColor = {
  new: 'bg-blue-100 text-blue-700', following: 'bg-yellow-100 text-yellow-700',
  test_drive: 'bg-purple-100 text-purple-700', negotiating: 'bg-orange-100 text-orange-700',
  booked: 'bg-green-100 text-green-700', delivered: 'bg-gray-100 text-gray-700', lost: 'bg-red-100 text-red-700'
}
const statusLabel = {
  new: 'New', following: 'Following', test_drive: 'Test Drive',
  negotiating: 'Negotiating', booked: 'Booked', delivered: 'Delivered', lost: 'Lost'
}
const priorityIcon = {
  hot: <Flame size={14} className="text-red-500" />,
  warm: <Thermometer size={14} className="text-orange-400" />,
  cold: <Snowflake size={14} className="text-blue-400" />
}

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select(`
        id, status, priority, next_followup, created_at,
        customers(full_name, phone),
        car_models(name)
      `)
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.customers?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.customers?.phone?.includes(search) ||
      l.car_models?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1; return acc
  }, {})

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inquiries</h1>
        <button
          onClick={() => navigate('/leads/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /><span>New</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, model..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'new', 'following', 'test_drive', 'negotiating', 'booked', 'lost'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {s === 'all' ? `All (${leads.length})` : `${statusLabel[s]} (${statusCounts[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Leads list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">No inquiries found</p>
            <button onClick={() => navigate('/leads/new')} className="mt-3 text-blue-600 text-sm font-medium">
              + Add first inquiry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(lead => {
              const isOverdue = lead.next_followup && lead.next_followup < today && lead.status !== 'lost' && lead.status !== 'delivered'
              return (
                <button
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600">
                      {lead.customers?.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{lead.customers?.full_name}</p>
                      {priorityIcon[lead.priority]}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{lead.car_models?.name || '–'}</p>
                    {lead.next_followup && (
                      <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {isOverdue ? '⚠ Overdue: ' : 'Follow-up: '}
                        {new Date(lead.next_followup).toLocaleDateString('en-MY')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[lead.status]}`}>
                      {statusLabel[lead.status]}
                    </span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
