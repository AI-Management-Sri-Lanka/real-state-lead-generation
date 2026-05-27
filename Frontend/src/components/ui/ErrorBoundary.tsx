import React from 'react'
import PropTypes from 'prop-types'

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

type ErrorBoundaryProps = {
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page px-4 py-16 text-slate-100 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-800 bg-slate-950/95 p-10 shadow-panel">
            <h1 className="text-3xl font-semibold text-white">Something went wrong.</h1>
            <p className="mt-4 text-slate-400">We couldn’t load this part of LeadAI. Try refreshing the page or come back in a moment.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-500">
                Reload page
              </button>
              <button type="button" onClick={() => this.setState({ hasError: false, error: null })} className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }

  static propTypes = {
    children: PropTypes.node,
  }
}
