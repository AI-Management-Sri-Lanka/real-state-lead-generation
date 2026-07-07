// src/components/buyer-lead/BuyerLeadModal.tsx
// Modal overlay for the multi-step buyer lead qualification form

import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { submitBuyerLead, BuyerLeadPayload } from '@/api/buyerLeadApi'
import StepPersonalInfo from './StepPersonalInfo'
import StepFinancialInfo from './StepFinancialInfo'
import StepPreferences from './StepPreferences'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
}

type FormData = {
  name: string
  mobile: string
  email: string
  household_income: string
  owns_property: boolean | null
  available_equity_over_300k: boolean | null
  deposit_amount: string
  age_group: string
  superannuation_over_230k: boolean | null
  australian_state: string
  preferred_contact_day: string
  preferred_contact_time: string
}

const INITIAL_FORM: FormData = {
  name: '',
  mobile: '',
  email: '',
  household_income: '',
  owns_property: null,
  available_equity_over_300k: null,
  deposit_amount: '',
  age_group: '',
  superannuation_over_230k: null,
  australian_state: '',
  preferred_contact_day: '',
  preferred_contact_time: '',
}

const STEPS = ['Personal Info', 'Financial & Profile', 'Preferences']

export default function BuyerLeadModal({ onClose }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  const update = useCallback((partial: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...partial }))
  }, [])

  const canGoNext = useCallback((): boolean => {
    if (step === 0) {
      return form.name.trim().length > 0
        && form.mobile.trim().length >= 5
        && form.email.trim().length > 0
    }
    if (step === 1) {
      if (!form.household_income || form.owns_property === null || !form.age_group || form.superannuation_over_230k === null) return false
      if (form.owns_property && form.available_equity_over_300k === null) return false
      if (!form.owns_property && !form.deposit_amount) return false
      return true
    }
    if (step === 2) {
      return !!form.australian_state && !!form.preferred_contact_day && !!form.preferred_contact_time
    }
    return true
  }, [step, form])

  const handleSubmit = useCallback(async () => {
    if (!canGoNext()) return
    setSubmitting(true)
    try {
      const payload: BuyerLeadPayload = {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        household_income: form.household_income,
        owns_property: form.owns_property!,
        available_equity_over_300k: form.owns_property ? form.available_equity_over_300k : null,
        deposit_amount: !form.owns_property ? form.deposit_amount : null,
        age_group: form.age_group,
        superannuation_over_230k: form.superannuation_over_230k!,
        australian_state: form.australian_state,
        preferred_contact_day: form.preferred_contact_day,
        preferred_contact_time: form.preferred_contact_time,
      }
      await submitBuyerLead(payload)
      toast.success('Your information has been submitted successfully!')
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }, [form, canGoNext, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: 16, width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'var(--color-muted, #f4f4fa)',
            border: 'none', borderRadius: 8,
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-text-secondary, #6b6b8e)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-border, #e2e2f0)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-muted, #f4f4fa)' }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ padding: '28px 28px 0' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-heading, #0f0f1a)', margin: 0 }}>
            🏠 Property Investment Lead
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary, #6b6b8e)', margin: '6px 0 0' }}>
            Fill in your details and we'll match you with the best property opportunities.
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 4 }}>
            {STEPS.map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: '100%', height: 3, borderRadius: 2,
                  background: i <= step ? 'var(--color-brand, #3d3bf3)' : 'var(--color-border, #e2e2f0)',
                  transition: 'background 0.3s',
                }} />
                <span style={{ fontSize: 11, fontWeight: i === step ? 600 : 400, color: i <= step ? 'var(--color-brand, #3d3bf3)' : 'var(--color-text-secondary, #6b6b8e)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '20px 28px' }}>
          {step === 0 && <StepPersonalInfo form={form} update={update} />}
          {step === 1 && <StepFinancialInfo form={form} update={update} />}
          {step === 2 && <StepPreferences form={form} update={update} />}
        </div>

        {/* Footer navigation */}
        <div style={{
          padding: '16px 28px 24px',
          display: 'flex', justifyContent: step === 0 ? 'flex-end' : 'space-between',
          borderTop: '1px solid var(--color-border, #e2e2f0)',
        }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'transparent', border: '1px solid var(--color-border, #e2e2f0)',
                color: 'var(--color-text-primary, #0f0f1a)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-muted, #f4f4fa)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              ← Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canGoNext()}
              style={{
                padding: '10px 24px', borderRadius: 10,
                background: canGoNext() ? 'var(--color-brand, #3d3bf3)' : 'var(--color-border, #e2e2f0)',
                border: 'none', color: canGoNext() ? '#fff' : 'var(--color-text-secondary, #6b6b8e)',
                fontSize: 14, fontWeight: 600, cursor: canGoNext() ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.15s',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              style={{
                padding: '10px 24px', borderRadius: 10,
                background: canGoNext() && !submitting ? 'linear-gradient(135deg,#3D3BF3 0%,#5B5BFF 100%)' : 'var(--color-border, #e2e2f0)',
                border: 'none', color: canGoNext() && !submitting ? '#fff' : 'var(--color-text-secondary, #6b6b8e)',
                fontSize: 14, fontWeight: 600, cursor: canGoNext() && !submitting ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.15s',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}