// // src/components/dashboard/ChatMessage.tsx
// import { Sparkles } from 'lucide-react'
// import { Avatar } from '@/components/ui/Avatar'

// type ChatMessageType = {
//   id: string
//   role: 'assistant' | 'user'
//   content: string
//   timestamp: Date
//   isTyping?: boolean
// }

// interface Props {
//   message: ChatMessageType
//   userName?: string
// }

// function renderContent(text: string) {
//   return text.split('\n').map((line, i) => {
//     if (line.trim() === '') return <div key={i} style={{ height: 6 }} />

//     // Bullet lines
//     if (line.startsWith('• '))
//       return (
//         <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
//           <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}>•</span>
//           <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
//         </div>
//       )

//     // Links — wrap URLs in <a> tags
//     const withLinks = line.replace(
//       /(https?:\/\/[^\s]+)/g,
//       '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--color-brand);text-decoration:underline;word-break:break-all;">$1</a>'
//     )

//     return (
//       <p
//         key={i}
//         style={{ marginBottom: 2 }}
//         dangerouslySetInnerHTML={{
//           __html: withLinks.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
//         }}
//       />
//     )
//   })
// }

// export function ChatMessage({ message, userName = 'You' }: Props) {
//   const isUser = message.role === 'user'

//   return (
//     <div
//       style={{
//         display: 'flex',
//         gap: 10,
//         flexDirection: isUser ? 'row-reverse' : 'row',
//         alignItems: 'flex-start',
//         animation: 'fadeIn 0.2s ease-out',
//       }}
//     >
//       {/* Avatar */}
//       {isUser ? (
//         <Avatar name={userName} size={32} />
//       ) : (
//         <div
//           style={{
//             width: 32, height: 32, borderRadius: '50%',
//             background: 'linear-gradient(135deg,#3D3BF3,#00C896)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             flexShrink: 0,
//           }}
//         >
//           <Sparkles size={15} style={{ color: 'white' }} />
//         </div>
//       )}

//       {/* Bubble */}
//       <div style={{ maxWidth: '72%' }}>
//         {/* AI label */}
//         {!isUser && (
//           <div
//             style={{
//               display: 'inline-flex', alignItems: 'center', gap: 5,
//               padding: '3px 8px', borderRadius: 20,
//               background: 'var(--color-brand-light)',
//               border: '1px solid rgba(61,59,243,0.15)',
//               marginBottom: 4,
//             }}
//           >
//             <Sparkles size={12} style={{ color: 'var(--color-brand)' }} />
//             <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-brand)', fontFamily: 'var(--font-sans)' }}>
//               AI assistant
//             </span>
//           </div>
//         )}

//         <div
//           style={{
//             padding: '12px 16px',
//             borderRadius: isUser ? '20px 6px 20px 20px' : '6px 20px 20px 20px',
//             background: isUser
//               ? 'linear-gradient(135deg,#3D3BF3,#5B5BFF)'
//               : 'var(--color-surface)',
//             border: isUser ? 'none' : '1px solid var(--color-border)',
//             color: isUser ? 'white' : 'var(--color-text-primary)',
//             fontSize: 14, lineHeight: 1.7, fontFamily: 'var(--font-sans)',
//             boxShadow: isUser
//               ? '0 12px 30px rgba(61,59,243,0.18)'
//               : '0 12px 30px rgba(3,13,33,0.07)',
//           }}
//         >
//           {message.isTyping ? (
//             <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
//               {[0, 1, 2].map(i => (
//                 <span
//                   key={i}
//                   style={{
//                     width: 6, height: 6, borderRadius: '50%',
//                     background: 'var(--color-brand)',
//                     animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
//                   }}
//                 />
//               ))}
//             </div>
//           ) : (
//             <div>{renderContent(message.content)}</div>
//           )}
//         </div>

//         {/* Timestamp */}
//         <p style={{ fontSize: 10, color: 'var(--color-text-placeholder)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
//           {message.timestamp instanceof Date
//             ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//             : ''}
//         </p>
//       </div>
//     </div>
//   )
// }

// src/components/dashboard/ChatMessage.tsx
import { Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

type ChatMessageType = {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
  isTyping?: boolean
  leads?: unknown[]  // accept leads so AIChat's extended type is compatible
}

interface Props {
  message: ChatMessageType
  userName?: string
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <div key={i} style={{ height: 6 }} />

    if (line.startsWith('• '))
      return (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
          <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      )

    const withLinks = line.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--color-brand);text-decoration:underline;word-break:break-all;">$1</a>'
    )

    return (
      <p
        key={i}
        style={{ marginBottom: 2 }}
        dangerouslySetInnerHTML={{
          __html: withLinks.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
        }}
      />
    )
  })
}

export function ChatMessage({ message, userName = 'You' }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {isUser ? (
        <Avatar name={userName} size={32} />
      ) : (
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3D3BF3,#00C896)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={15} style={{ color: 'white' }} />
        </div>
      )}

      <div style={{ maxWidth: '72%' }}>
        {!isUser && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 20,
              background: 'var(--color-brand-light)',
              border: '1px solid rgba(61,59,243,0.15)',
              marginBottom: 4,
            }}
          >
            <Sparkles size={12} style={{ color: 'var(--color-brand)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-brand)', fontFamily: 'var(--font-sans)' }}>
              AI assistant
            </span>
          </div>
        )}

        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '20px 6px 20px 20px' : '6px 20px 20px 20px',
            background: isUser
              ? 'linear-gradient(135deg,#3D3BF3,#5B5BFF)'
              : 'var(--color-surface)',
            border: isUser ? 'none' : '1px solid var(--color-border)',
            color: isUser ? 'white' : 'var(--color-text-primary)',
            fontSize: 14, lineHeight: 1.7, fontFamily: 'var(--font-sans)',
            boxShadow: isUser
              ? '0 12px 30px rgba(61,59,243,0.18)'
              : '0 12px 30px rgba(3,13,33,0.07)',
          }}
        >
          {message.isTyping ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-brand)',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div>{renderContent(message.content)}</div>
          )}
        </div>

        <p style={{ fontSize: 10, color: 'var(--color-text-placeholder)', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
          {message.timestamp instanceof Date
            ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </p>
      </div>
    </div>
  )
}