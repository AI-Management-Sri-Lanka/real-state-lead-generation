import { useEffect, useState, type RefObject } from 'react'
import { ArrowUp } from 'lucide-react'

interface Props {
  /** Scrollable element to watch/scroll. Defaults to the window. */
  scrollContainerRef?: RefObject<HTMLElement>
  /** Scroll distance (px) after which the button appears. */
  threshold?: number
}

export function BackToTopButton({ scrollContainerRef, threshold = 300 }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = scrollContainerRef?.current
    const target: HTMLElement | Window = container ?? window

    const handleScroll = () => {
      const scrollTop = container ? container.scrollTop : window.scrollY
      setVisible(scrollTop > threshold)
    }

    handleScroll()
    target.addEventListener('scroll', handleScroll, { passive: true })
    return () => target.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef, threshold])

  if (!visible) return null

  const handleClick = () => {
    const container = scrollContainerRef?.current
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      style={{ background: 'var(--color-brand, #37b754)', color: '#fff' }}
    >
      <ArrowUp size={20} />
    </button>
  )
}
