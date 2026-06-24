// src/pages/auth/SignInPage.tsx
import { AuthBrandPanel } from './components/AuthBrandPanel'
import { AuthFormShell }  from './components/AuthFormShell'
import { SignInForm }     from './components/SignInForm'

const HEADING = (<>Find your next <span style={{ color:'#00C896', fontStyle:'italic' }}>property buyer</span><br />with AI.</>)

export default function SignInPage() {
  return (
    <div className="auth-root">
      <AuthBrandPanel
        heading={HEADING}
        subheading="Automatically discover qualified leads from Facebook and Instagram using conversational AI."
        bullets={['AI-powered buyer discovery','Real-time social media scraping','Instant lead qualification','Smart match scoring']}
      />
      <AuthFormShell width={520}><SignInForm /></AuthFormShell>
    </div>
  )
}