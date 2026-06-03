// src/components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string
  leftIcon?: React.ReactNode; rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, leftIcon, rightIcon,
  type='text', fullWidth=true, id, style, ...props
}, ref) => {
  const [showPw, setShowPw] = useState(false)
  const inputId  = id ?? label?.toLowerCase().replace(/\s+/g,'-')
  const isPw     = type === 'password'
  const inputType = isPw ? (showPw ? 'text' : 'password') : type
  const hasRight  = isPw || !!rightIcon

  return (
    <div style={{ width: fullWidth?'100%':undefined, display:'flex', flexDirection:'column', gap:6 }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)', fontFamily:'var(--font-sans)' }}>
          {label}
        </label>
      )}
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        {leftIcon && (
          <span style={{ position:'absolute', left:13, color: error ? 'var(--color-error)' : 'var(--color-text-placeholder)', display:'flex', alignItems:'center', pointerEvents:'none' }}>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref} id={inputId} type={inputType}
          style={{
            width:'100%', height:48,
            padding:`0 ${hasRight?44:14}px 0 ${leftIcon?42:14}px`,
            background:'var(--color-input-bg)',
            border:`1.5px solid ${error?'var(--color-error)':'var(--color-input-border)'}`,
            borderRadius:'var(--radius-md)',
            color:'var(--color-text-heading)', fontSize:14,
            fontFamily:'var(--font-sans)', outline:'none',
            transition:'border-color 0.15s, box-shadow 0.15s',
            ...style,
          }}
          onFocus={e => {
            e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-input-focus)'
            e.target.style.boxShadow   = error ? '0 0 0 3px rgba(239,68,68,0.1)' : '0 0 0 3px rgba(61,59,243,0.1)'
            e.target.style.background  = 'var(--color-input-bg)'
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-input-border)'
            e.target.style.boxShadow   = 'none'
            e.target.style.background  = 'var(--color-input-bg)'
          }}
          {...props}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(v=>!v)}
            style={{ position:'absolute', right:13, background:'none', border:'none', cursor:'pointer', color:'var(--color-text-placeholder)', display:'flex', padding:4, borderRadius:6 }}>
            {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        )}
        {!isPw && rightIcon && (
          <span style={{ position:'absolute', right:13, color:'var(--color-text-placeholder)', display:'flex' }}>{rightIcon}</span>
        )}
      </div>
      {error && <span style={{ fontSize:12, color:'var(--color-error)', fontFamily:'var(--font-sans)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize:12, color:'var(--color-text-placeholder)', fontFamily:'var(--font-sans)' }}>{hint}</span>}
    </div>
  )
})
Input.displayName = 'Input'
