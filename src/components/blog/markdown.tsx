'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

/** External links typed without a protocol (e.g. "www.baidu.com") must not
 *  become in-site relative URLs. */
export function normalizeLink(href: string | undefined): string | undefined {
  if (!href) return href
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(href) || // has scheme (https:, mailto:, tel:, ...)
    href.startsWith('/') ||
    href.startsWith('#')
  ) {
    return href
  }
  return `https://${href}`
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        a({ href, children, ...props }) {
          const normalized = normalizeLink(href)
          const external = Boolean(normalized && !normalized.startsWith('/') && !normalized.startsWith('#'))
          return (
            <a
              href={normalized}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              {...props}
            >
              {children}
            </a>
          )
        },
        img({ src, alt, ...props }) {
          const normalizedSrc = typeof src === 'string' ? normalizeLink(src) : src
          return <img src={normalizedSrc} alt={alt ?? ''} loading="lazy" className="rounded-xl" {...props} />
        },
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match && !className
          if (isInline) {
            return <code className={className} {...props}>{children}</code>
          }
          return (
            <SyntaxHighlighter
              style={oneDark}
              language={match?.[1] || 'text'}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          )
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
