import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Phone, MessageCircle, Plus, Flame, Thermometer, Snowflake, ChevronDown } from 'lucide-react'

const statusColor = {
  new: 'bg-blue-100 text-blue-700', following: 'bg-yellow-100 text-yellow-700',
  test_drive: 'bg-purple-100 text-purple-700', negotiating: 'bg-orange-100 text-orange-700',
  booked: 'bg-green-100 text-green-700', delivered: 'bg-gray-100 text-gray-700', lost: 'bg-red-100 text-red-700'
}
const statusLabel = {
  new: 'New', following: 'Following', test_drive: 'Test Drive',
  negotiating: 'Negotiating', booked: 'Booked', delivered: 'Delivered', lost: 'Lost'
}
const responseColor = {
  positive: 'text-green-600', neutral: 'text-gray-500',
  negative: 'text-red-500', no_response: 'text-gray-400'
}
const responseLabel = { positive: '👍 Positive', neutral: '😐 Neutral', negative: '👎 Negative', no_response: '📵 No Response' }

export default function LeadDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogForm, setShowLogForm] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [logForm, setLogForm] = useState({
    method: 'whatsapp', notes: '', customer_response: 'positive', next_action: '', next_followup: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadLead() }, [id])

  async function loadLead() {
    setLoading(true)
    const [leadRes, logsRes] = await Promise.all([
      supabase.from('leads').select(`
        *, customers(*), car_models(*)
      `).eq('id', id).single(),
      supabase.from('followup_logs').select('*').eq('lead_id', id).order('created_at', { ascending: false })
    ])
    setLead(leadRes.data)
    setLogs(logsRes.data || [])
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setLead({ ...lead, status: newStatus })
    setShowStatusMenu(false)
  }

  async function addLog(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('followup_logs').insert({
      lead_id: id,
      ...logForm,
      next_followup: logForm.next_followup || null,
      created_by: session.user.id
    })
    if (!error) {
      // Update lead's next_followup and status
      const updates = { updated_at: new Date().toISOString() }
      if (logForm.next_followup) updates.next_followup = logForm.next_followup
      if (lead.status === 'new') updates.status = 'following'
      await supabase.from('leads').update(updates).eq('id', id)
      setLogForm({ method: 'whatsapp', notes: '', customer_response: 'positive', next_action: '', next_followup: '' })
      setShowLogForm(false)
      loadLead()
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
  if (!lead) return <div className="text-center py-20 text-gray-400">Lead not found</div>

  const c = lead.customers
  const m = lead.car_models

  return (
    <div className="max-w-lg mx-auto pb-24 md:pb-0 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{c?.full_name}</h1>
          <p className="text-sm text-gray-400">{c?.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          {lead.priority === 'hot' ? <Flame size={18} className="text-red-500" /> :
           lead.priority === 'warm' ? <Thermometer size={18} className="text-orange-400" /> :
           <Snowflake size={18} className="text-blue-400" />}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <a href={`tel:${c?.phone}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
          <Phone size={16} /> Call
        </a>
        <a href={`https://wa.me/6${c?.phone?.replace(/^0/, '')}`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Status</p>
          <div className="relative">
            <button onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusColor[lead.status]}`}>
              {statusLabel[lead.status]}
              <ChevronDown size={14} />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 z-10 min-w-40 overflow-hidden">
                {Object.entries(statusLabel).map(([s, l]) => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${lead.status === s ? 'font-semibold text-blue-600' : 'text-gray-700'}`}>
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Model</p>
            <p className="font-medium text-gray-900">{m?.name || '–'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Colour</p>
            <p className="font-medium text-gray-900">{lead.preferred_colour || '–'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Transmission</p>
            <p className="font-medium text-gray-900 capitalize">{lead.transmission || '–'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Next Follow-up</p>
            <p className={`font-medium ${lead.next_followup && lead.next_followup < new Date().toISOString().split('T')[0] ? 'text-red-500' : 'text-gray-900'}`}>
              {lead.next_followup ? new Date(lead.next_followup).toLocaleDateString('en-MY') : '–'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Source</p>
            <p className="font-medium text-gray-900 capitalize">{c?.source || '–'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Created</p>
            <p className="font-medium text-gray-900">{new Date(lead.created_at).toLocaleDateString('en-MY')}</p>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{lead.notes}</p>
          </div>
        )}

        {m && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Base OTR Price</p>
            <p className="font-semibold text-gray-900">RM {m.base_otr?.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Follow-up log section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Follow-up History</h2>
          <button onClick={() => setShowLogForm(!showLogForm)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
            <Plus size={15} /> Add Log
          </button>
        </div>

        {/* Add log form */}
        {showLogForm && (
          <form onSubmit={addLog} className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                <select value={logForm.method} onChange={e => setLogForm({ ...logForm, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {['phone','whatsapp','visit','email'].map(m => (
                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Response</label>
                <select value={logForm.customer_response} onChange={e => setLogForm({ ...logForm, customer_response: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {Object.entries(responseLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes *</label>
              <textarea value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                required rows={3} placeholder="What did you discuss with the customer?"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Next Action</label>
                <input type="text" value={logForm.next_action} onChange={e => setLogForm({ ...logForm, next_action: e.target.value })}
                  placeholder="e.g. Send brochure"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
                <input type="date" value={logForm.next_followup} onChange={e => setLogForm({ ...logForm, next_followup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLogForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </form>
        )}

        {/* Log list */}
        {logs.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No follow-up logs yet.<br />
            <button onClick={() => setShowLogForm(true)} className="text-blue-600 font-medium mt-1">Add first log</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize font-medium">
                      {log.method}
                    </span>
                    <span className={`text-xs font-medium ${responseColor[log.customer_response]}`}>
                      {responseLabel[log.customer_response]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(log.created_at).toLocaleDateString('en-MY')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{log.notes}</p>
                {log.next_action && (
                  <p className="text-xs text-blue-600 mt-1.5">→ {log.next_action}</p>
                )}
                {log.next_followup && (
                  <p className="text-xs text-gray-400 mt-1">
                    📅 Next: {new Date(log.next_followup).toLocaleDateString('en-MY')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
