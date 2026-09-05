import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthBrandPanel } from './components/AuthBrandPanel'
import { AuthFormShell } from './components/AuthFormShell'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/api/authApi'
import { isValidEmail } from '@/utils/validation'

const INITIAL = {
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: '',
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'done'>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const passwordRules = useMemo(() => [
    { label: '8+ characters', valid: newPassword.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(newPassword) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(newPassword) },
    { label: 'Number', valid: /[0-9]/.test(newPassword) },
    { label: 'Special character', valid: /[!@#$%^&*()_+={}\[\]|\\:;"'<>?,./~`-]/.test(newPassword) },
  ], [newPassword])

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    if (!email || !isValidEmail(email)) {
      toast.error('Enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const result = await authApi.forgotPassword({ email })
      setEmail(result.email || email)
      setOtpSent(true)
      setStep('verify')
      toast.success('A one-time password has been sent to your email.')
    } catch (err) {
      toast.error((err as Error).message || 'Unable to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error('Enter the 6-digit code sent to your email')
      return
    }

    setLoading(true)
    try {
      await authApi.verifyOTP({ email, otp })
      setStep('reset')
      toast.success('OTP verified successfully')
    } catch (err) {
      toast.error((err as Error).message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error('Please enter and confirm your new password')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+={}\[\]|\\:;"'<>?,./~`-]/.test(newPassword)) {
      toast.error('Password must satisfy the listed rules')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ email, otp, new_password: newPassword, confirm_password: confirmPassword })
      setStep('done')
      toast.success('Password reset successfully')
    } catch (err) {
      toast.error((err as Error).message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  const renderForm = () => {
    if (step === 'done') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle2 size={56} color="#16a34a" />
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Password reset complete</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>You can now sign in with your new password.</p>
          </div>
          <Button onClick={() => navigate('/auth/signin')} fullWidth size="lg" iconRight={<ArrowRight size={17} />}>
            Back to sign in
          </Button>
        </div>
      )
    }

    if (step === 'verify') {
      return (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 8 }}>One-time password</p>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Verify your code</h2>
          </div>

          <Input
            label="6-digit OTP"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter the code you received"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />

          <Button type="submit" fullWidth size="lg" loading={loading} iconRight={!loading ? <ArrowRight size={17} /> : undefined}>
            {loading ? 'Verifying…' : 'Verify code'}
          </Button>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Didn’t get it?{' '}
            <button type="button" onClick={handleSendOtp} style={{ border: 'none', background: 'transparent', color: 'var(--color-brand)', fontWeight: 700, cursor: 'pointer' }}>
              Resend code
            </button>
          </p>
        </form>
      )
    }

    if (step === 'reset') {
      return (
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 8 }}>Secure reset</p>
            <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Set a new password</h2>
          </div>

          <Input
            label="New password"
            name="newPassword"
            type="password"
            placeholder="Create a strong new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 12, background: '#f5f7ff', border: '1px solid #e5e7ff' }}>
            {passwordRules.map((rule) => (
              <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: rule.valid ? '#15803d' : '#4b5563' }}>
                <ShieldCheck size={14} style={{ opacity: rule.valid ? 1 : 0.45 }} />
                <span>{rule.label}</span>
              </div>
            ))}
          </div>

          <Button type="submit" fullWidth size="lg" loading={loading} iconRight={!loading ? <ArrowRight size={17} /> : undefined}>
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      )
    }

    return (
      <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-brand)', marginBottom: 8 }}>Recover access</p>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Forgot password?</h2>
        </div>

        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth size="lg" loading={loading} iconRight={!loading ? <ArrowRight size={17} /> : undefined}>
          {loading ? 'Sending…' : 'Send OTP'}
        </Button>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Remembered it?{' '}
          <Link to="/auth/signin" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 700 }}>Back to sign in</Link>
        </p>
      </form>
    )
  }

  return (
    <div className="auth-root">
      <AuthBrandPanel
        heading={<>Reset access to your <span style={{ color: '#00C896', fontStyle: 'italic' }}>account</span>.</>}
        subheading="Receive a one-time password, verify it, and create a new secure password in minutes."
        bullets={['Secure reset flow', '6-digit OTP verification', 'Strong password validation']}
      />
      <AuthFormShell width={520}>{renderForm()}</AuthFormShell>
    </div>
  )
}
