// src/components/buyer-lead/StepPreferences.tsx
// Step 3: Location & Contact Preferences — State, Contact Day, Contact Time

interface Props {
  form: {
    australian_state: string
    preferred_contact_day: string
    preferred_contact_time: string
  }
  update: (partial: Record<string, unknown>) => void
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: 'var(--color-text-primary, #0f0f1a)',
  fontFamily: 'var(--font-sans)', marginBottom: 6, display: 'block',
}

const selectStyle: React.CSSProperties = {
  width: '100%', height: 44,
  padding: '0 14px',
  background: 'var(--color-input-bg, #f8f8fc)',
  border: '1.5px solid var(--color-input-border, #e2e2f0)',
  borderRadius: 10,
  color: 'var(--color-text-primary, #0f0f1a)',
  fontSize: 14, fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
  cursor: 'pointer',
}

const STATES = [
  'New South Wales',
  'Victoria',
  'Queensland',
  'Western Australia',
  'South Australia',
  'Tasmania',
  'Australian Capital Territory',
  'Northern Territory',
]

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

const TIMES = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
]

export default function StepPreferences({ form, update }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Australian State */}
      <div>
        <label style={labelStyle}>Australian State / Territory *</label>
        <select
          style={selectStyle}
          value={form.australian_state}
          onChange={e => update({ australian_state: e.target.value })}
        >
          <option value="">Select state...</option>
          {STATES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Preferred Contact Day */}
      <div>
        <label style={labelStyle}>Preferred Contact Day *</label>
        <select
          style={selectStyle}
          value={form.preferred_contact_day}
          onChange={e => update({ preferred_contact_day: e.target.value })}
        >
          <option value="">Select day...</option>
          {DAYS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Preferred Contact Time */}
      <div>
        <label style={labelStyle}>Preferred Contact Time *</label>
        <select
          style={selectStyle}
          value={form.preferred_contact_time}
          onChange={e => update({ preferred_contact_time: e.target.value })}
        >
          <option value="">Select time slot...</option>
          {TIMES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={{
        marginTop: 8, padding: 14, borderRadius: 10,
        background: 'var(--color-muted, #f4f4fa)',
        border: '1px solid var(--color-border, #e2e2f0)',
        fontSize: 12, color: 'var(--color-text-secondary, #6b6b8e)',
        lineHeight: 1.5, fontFamily: 'var(--font-sans)',
      }}>
        By submitting, you agree to be contacted by our team regarding property investment opportunities.
      </div>
    </div>
  )
}