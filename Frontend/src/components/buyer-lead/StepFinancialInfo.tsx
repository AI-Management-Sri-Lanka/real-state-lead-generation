// src/components/buyer-lead/StepFinancialInfo.tsx
// Step 2: Financial & Profile — Income, Ownership, Deposit, Age, Super

interface Props {
  form: {
    household_income: string
    owns_property: boolean | null
    available_equity_over_300k: boolean | null
    deposit_amount: string
    age_group: string
    superannuation_over_230k: boolean | null
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

const radioGroupStyle: React.CSSProperties = {
  display: 'flex', gap: 10,
}

const radioBtnStyle = (selected: boolean): React.CSSProperties => ({
  flex: 1, height: 40,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 10,
  background: selected ? 'var(--color-brand, #3d3bf3)' : 'var(--color-input-bg, #f8f8fc)',
  border: selected ? 'none' : '1.5px solid var(--color-input-border, #e2e2f0)',
  color: selected ? '#fff' : 'var(--color-text-primary, #0f0f1a)',
  fontSize: 13, fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.15s',
})

export default function StepFinancialInfo({ form, update }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Household Income */}
      <div>
        <label style={labelStyle}>Household Income *</label>
        <select
          style={selectStyle}
          value={form.household_income}
          onChange={e => update({ household_income: e.target.value })}
        >
          <option value="">Select income range...</option>
          <option value="$120,000 - $150,000">$120,000 - $150,000</option>
          <option value="$150,000 - $180,000">$150,000 - $180,000</option>
          <option value="$180,000+">$180,000+</option>
        </select>
      </div>

      {/* Owns Property */}
      <div>
        <label style={labelStyle}>Do you currently own a property? *</label>
        <div style={radioGroupStyle}>
          <div
            style={radioBtnStyle(form.owns_property === true)}
            onClick={() => update({ owns_property: true, available_equity_over_300k: null, deposit_amount: '' })}
          >
            Yes
          </div>
          <div
            style={radioBtnStyle(form.owns_property === false)}
            onClick={() => update({ owns_property: false, available_equity_over_300k: null })}
          >
            No
          </div>
        </div>
      </div>

      {/* Available Equity (conditional) */}
      {form.owns_property === true && (
        <div>
          <label style={labelStyle}>Do you have available equity over $300k? *</label>
          <div style={radioGroupStyle}>
            <div
              style={radioBtnStyle(form.available_equity_over_300k === true)}
              onClick={() => update({ available_equity_over_300k: true })}
            >
              Yes
            </div>
            <div
              style={radioBtnStyle(form.available_equity_over_300k === false)}
              onClick={() => update({ available_equity_over_300k: false })}
            >
              No
            </div>
          </div>
        </div>
      )}

      {/* Deposit Amount (conditional) */}
      {form.owns_property === false && (
        <div>
          <label style={labelStyle}>Deposit Amount *</label>
          <select
            style={selectStyle}
            value={form.deposit_amount}
            onChange={e => update({ deposit_amount: e.target.value })}
          >
            <option value="">Select deposit range...</option>
            <option value="$40,000 - $50,000 (First Home Buyer)">$40,000 - $50,000 (First Home Buyer)</option>
            <option value="$80,000+ (Investor)">$80,000+ (Investor)</option>
            <option value="Less than $40,000">Less than $40,000</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      )}

      {/* Age Group */}
      <div>
        <label style={labelStyle}>Age Group *</label>
        <select
          style={selectStyle}
          value={form.age_group}
          onChange={e => update({ age_group: e.target.value })}
        >
          <option value="">Select age group...</option>
          <option value="18 - 29 years">18 - 29 years</option>
          <option value="30 - 44 years">30 - 44 years</option>
          <option value="45 - 59 years">45 - 59 years</option>
          <option value="60+ years">60+ years</option>
        </select>
      </div>

      {/* Superannuation */}
      <div>
        <label style={labelStyle}>Do you have superannuation over $230k? *</label>
        <div style={radioGroupStyle}>
          <div
            style={radioBtnStyle(form.superannuation_over_230k === true)}
            onClick={() => update({ superannuation_over_230k: true })}
          >
            Yes
          </div>
          <div
            style={radioBtnStyle(form.superannuation_over_230k === false)}
            onClick={() => update({ superannuation_over_230k: false })}
          >
            No
          </div>
        </div>
      </div>
    </div>
  )
}