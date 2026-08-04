// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
export type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  icon?:      React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

const base = `
  inline-flex items-center justify-center gap-2 font-medium
  border transition-all duration-150 ease-out cursor-pointer
  select-none disabled:opacity-50 disabled:cursor-not-allowed
`

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background:'linear-gradient(135deg,#3D3BF3 0%,#5B5BFF 100%)', color:'#fff', border:'none',                     boxShadow:'0 4px 20px rgba(61,59,243,0.35)', borderRadius:10 },
  secondary: { background:'#FFFFFF',   color:'#2D2D4A', border:'1px solid #E2E2F0', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', borderRadius:10 },
  ghost:     { background:'transparent', color:'#6B6B8E', border:'1px solid transparent', borderRadius:10 },
  danger:    { background:'#FEE2E2',   color:'#EF4444', border:'1px solid #FECACA', borderRadius:10 },
  outline:   { background:'transparent', color:'#3D3BF3', border:'1px solid #3D3BF3', borderRadius:10 },
}

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { height:34, padding:'0 14px', fontSize:13 },
  md: { height:42, padding:'0 18px', fontSize:14 },
  lg: { height:50, padding:'0 24px', fontSize:15 },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant='primary', size='md', loading=false,
  icon, iconRight, fullWidth=false, children, style, disabled, ...props
}, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    style={{
      ...variants[variant], ...sizes[size],
      width: fullWidth ? '100%' : undefined,
      fontFamily: 'var(--font-sans)',
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
      cursor: disabled||loading ? 'not-allowed' : 'pointer',
      opacity: disabled||loading ? 0.6 : 1,
      transition:'all 0.15s',
      ...style,
    }}
    onMouseEnter={e => {
      if (disabled||loading) return
      const el = e.currentTarget
      if (variant === 'primary')    el.style.opacity = '0.9'
      if (variant === 'secondary')  { el.style.background='#F4F4FA'; el.style.borderColor='#C4C4DC' }
      if (variant === 'ghost')      { el.style.background='#F4F4FA'; el.style.color='#2D2D4A' }
      if (variant === 'outline')    el.style.background='#EEEEFF'
    }}
    onMouseLeave={e => {
      if (disabled||loading) return
      const el = e.currentTarget
      if (variant === 'primary')    el.style.opacity = '1'
      if (variant === 'secondary')  { el.style.background='#FFFFFF'; el.style.borderColor='#E2E2F0' }
      if (variant === 'ghost')      { el.style.background='transparent'; el.style.color='#6B6B8E' }
      if (variant === 'outline')    el.style.background='transparent'
    }}
    {...props}
  >
    {loading
      ? <span style={{ width:16,height:16,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }} />
      : icon}
    {children}
    {!loading && iconRight}
  </button>
))
Button.displayName = 'Button'
