import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, User, Car, Calendar } from 'lucide-react'

export default function NewLead({ session }) {
  const navigate = useNavigate()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=customer, 2=inquiry

  const [customer, setCustomer] = useState({
    full_name: '', phone: '', email: '', ic_number: '', source: 'walk-in', notes: ''
  })
  const [lead, setLead] = useState({
    model_id: '', preferred_colour: '', transmission: 'auto',
    priority: 'warm', next_followup: '', notes: ''
  })
  const [existingCustomers, setExistingCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchPhone, setSearchPhone] = useState('')

  useEffect(() => {
    supabase.from('car_models').select('*').eq('is_active', true).then(({ data }) => setModels(data || []))
  }, [])

  async function searchCustomer() {
    if (!searchPhone) return
    const { data } = await supabase.from('customers').select('*').ilike('phone', `%${searchPhone}%`)
    setExistingCustomers(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let customerId = selectedCustomer?.id

      // Get centre
      const { data: centres } = await supabase.from('centres').select('id').limit(1)
      const centreId = centres?.[0]?.id

      if (!customerId) {
        const { data: newCustomer, error: cErr } = await supabase.from('customers').insert({
          ...customer,
          centre_id: centreId,
          assigned_sa: session.user.id
        }).select().single()
        if (cErr) throw cErr
        customerId = newCustomer.id
      }

      const { error: lErr } = await supabase.from('leads').insert({
        customer_id: customerId,
        model_id: lead.model_id || null,
        preferred_colour: lead.preferred_colour,
        transmission: lead.transmission,
        priority: lead.priority,
        next_followup: lead.next_followup || null,
        notes: lead.notes,
        assigned_sa: session.user.id,
        centre_id: centreId,
        status: 'new'
      })
      if (lErr) throw lErr

      navigate('/leads')
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setLoading(false)
  }

  const selectedModel = models.find(m => m.id === lead.model_id)

  return (
    <div className="max-w-lg mx-auto pb-24 md:pb-0">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Inquiry</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {[{ n: 1, label: 'Customer', icon: User }, { n: 2, label: 'Inquiry', icon: Car }].map(s => (
          <button key={s.n} onClick={() => step === 2 && setStep(s.n)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
            <s.icon size={16} />{s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Customer */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Quick search */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Check existing customer</p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Search by phone number"
                  value={searchPhone}
                  onChange={e => setSearchPhone(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
                <button type="button" onClick={searchCustomer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  Search
                </button>
              </div>
              {existingCustomers.length > 0 && (
                <div className="mt-2 space-y-1">
                  {existingCustomers.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setSelectedCustomer(c); setCustomer({ full_name: c.full_name, phone: c.phone, email: c.email || '', ic_number: c.ic_number || '', source: c.source || 'walk-in', notes: '' }) }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCustomer?.id === c.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
                      {c.full_name} — {c.phone}
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && (
                <p className="text-xs text-blue-700 mt-2 font-medium">✓ Using existing customer: {selectedCustomer.full_name}</p>
              )}
            </div>

            {/* Customer fields */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                {selectedCustomer ? 'Customer Details (readonly)' : 'New Customer Details'}
              </p>
              {[
                { key: 'full_name', label: 'Full Name *', type: 'text', required: true },
                { key: 'phone', label: 'Phone Number *', type: 'tel', required: true },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'ic_number', label: 'IC / Passport Number', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={customer[f.key]}
                    onChange={e => !selectedCustomer && setCustomer({ ...customer, [f.key]: e.target.value })}
                    required={f.required && !selectedCustomer}
                    readOnly={!!selectedCustomer}
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCustomer ? 'bg-gray-50 text-gray-500' : ''}`}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
                <select value={customer.source} onChange={e => setCustomer({ ...customer, source: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['walk-in','facebook','referral','phone','web','other'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-',' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="button" onClick={() => setStep(2)}
              disabled={!selectedCustomer && !customer.full_name}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
              Next: Inquiry Details →
            </button>
          </div>
        )}

        {/* Step 2: Lead details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">Inquiry Details</p>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Interested Model</label>
                <select value={lead.model_id} onChange={e => setLead({ ...lead, model_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">– Select model –</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name} — RM {m.base_otr.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              {selectedModel && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Colour</label>
                  <select value={lead.preferred_colour} onChange={e => setLead({ ...lead, preferred_colour: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">– Select colour –</option>
                    {selectedModel.colours?.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transmission</label>
                <div className="flex gap-2">
                  {['auto','manual'].map(t => (
                    <button key={t} type="button" onClick={() => setLead({ ...lead, transmission: t })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        lead.transmission === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                      }`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <div className="flex gap-2">
                  {[
                    { v: 'hot', label: '🔥 Hot' },
                    { v: 'warm', label: '☀️ Warm' },
                    { v: 'cold', label: '🧊 Cold' }
                  ].map(p => (
                    <button key={p.v} type="button" onClick={() => setLead({ ...lead, priority: p.v })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        lead.priority === p.v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Next Follow-up Date</label>
                <input type="date" value={lead.next_followup} onChange={e => setLead({ ...lead, next_followup: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={lead.notes} onChange={e => setLead({ ...lead, notes: e.target.value })}
                  rows={3} placeholder="Customer requirements, special notes..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                ← Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-2 flex-grow bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : '✓ Save Inquiry'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
