// src/pages/auth/SignUpPage.tsx
import { AuthBrandPanel } from './components/AuthBrandPanel'
import { AuthFormShell }  from './components/AuthFormShell'
import { SignUpForm }     from './components/SignUpForm'

const HEADING = (<>Start finding <span style={{ color:'#00C896', fontStyle:'italic' }}>buyers</span><br />automatically.</>)

export default function SignUpPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'var(--font-sans)' }}>
      <AuthBrandPanel
        heading={HEADING}
        subheading="Join real estate agents using AI to discover qualified buyers from social media — automatically."
        bullets={['Free 14-day trial, no credit card','OpenAI-powered chat assistant','Live Facebook & Instagram scraping','Real-time lead scoring']}
      />
      <AuthFormShell width={520}><SignUpForm /></AuthFormShell>
    </div>
  )
}
