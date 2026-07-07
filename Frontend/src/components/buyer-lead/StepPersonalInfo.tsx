// src/components/buyer-lead/StepPersonalInfo.tsx
// Step 1: Personal Information — Name, Mobile, Email

interface Props {
  form: {
    name: string
    mobile: string
    email: string
  }
  update: (partial: Record<string, unknown>) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44,
  padding: '0 14px',
  background: 'var(--color-input-bg, #f8f8fc)',
  border: '1.5px solid var(--color-input-border, #e2e2f0)',
  borderRadius: 10,
  color: 'var(--color-text-primary, #0f0f1a)',
  fontSize: 14, fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: 'var(--color-text-primary, #0f0f1a)',
  fontFamily: 'var(--font-sans)', marginBottom: 6, display: 'block',
}

export default function StepPersonalInfo({ form, update }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Full Name *</label>
        <input
          style={inputStyle}
          placeholder="John Doe"
          value={form.name}
          onChange={e => update({ name: e.target.value })}
          onFocus={e => { e.target.style.borderColor = 'var(--color-brand, #3d3bf3)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,59,243,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--color-input-border, #e2e2f0)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Mobile Number *</label>
        <input
          style={inputStyle}
          placeholder="+61 4XX XXX XXX"
          value={form.mobile}
          onChange={e => update({ mobile: e.target.value })}
          onFocus={e => { e.target.style.borderColor = 'var(--color-brand, #3d3bf3)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,59,243,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--color-input-border, #e2e2f0)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Email Address *</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="john@example.com"
          value={form.email}
          onChange={e => update({ email: e.target.value })}
          onFocus={e => { e.target.style.borderColor = 'var(--color-brand, #3d3bf3)'; e.target.style.boxShadow = '0 0 0 3px rgba(61,59,243,0.1)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--color-input-border, #e2e2f0)'; e.target.style.boxShadow = 'none' }}
        />
      </div>
    </div>
  )
}