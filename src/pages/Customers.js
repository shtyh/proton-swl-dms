import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Phone, MessageCircle, ChevronRight } from 'lucide-react'

const sourceColor = {
  'walk-in': 'bg-blue-100 text-blue-700', facebook: 'bg-indigo-100 text-indigo-700',
  referral: 'bg-green-100 text-green-700', phone: 'bg-yellow-100 text-yellow-700',
  web: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600'
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setCustomers(data || []); setLoading(false) })
  }, [])

  const filtered = customers.filter(c =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.ic_number?.includes(search)
  )

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <span className="text-sm text-gray-400">{customers.length} total</span>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, IC..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No customers found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-600">
                    {c.full_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{c.full_name}</p>
                    {c.source && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColor[c.source] || sourceColor.other}`}>
                        {c.source}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{c.phone}</p>
                  {c.ic_number && <p className="text-xs text-gray-400">IC: {c.ic_number}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a href={`tel:${c.phone}`}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100">
                    <Phone size={15} />
                  </a>
                  <a href={`https://wa.me/6${c.phone?.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100">
                    <MessageCircle size={15} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
