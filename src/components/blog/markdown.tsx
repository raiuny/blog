'use client'

import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
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
const RAW_IMAGE_CACHE_VERSION = '2'

function bustRawImageCache(url: string): string {
  if (!url.startsWith('https://raw.githubusercontent.com/')) return url
  return `${url}${url.includes('?') ? '&' : '?'}v=${RAW_IMAGE_CACHE_VERSION}`
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
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
        img({ src, alt, node: _node, width, height, ...props }) {
          // Typora-style size suffix: ![](url =400) =400px wide, =50% of the
          // column, =400x300 fixed. Requires a space before "=" so plain URLs
          // ending in "=digits" are not misparsed.
          let url = typeof src === 'string' ? src : undefined
          let suffixWidth: string | undefined
          let suffixHeight: string | undefined
          if (url) {
            // react-markdown keeps pointy-bracket destinations verbatim but
            // percent-encodes spaces: "<url =200>" arrives as "url%20=200".
            const m = url.match(/(?:\s|%20)=\s*(\d+(?:%|px)?)(?:x(\d+(?:%|px)?))?\s*$/)
            if (m) {
              url = url.slice(0, m.index)
              suffixWidth = m[1]
              suffixHeight = m[2]
            }
            url = bustRawImageCache(normalizeLink(url) ?? url)
          }

          // Raw HTML <img width="60%"> support (rehype-raw). Explicit width
          // attribute wins over the suffix; bare digits mean px.
          const resolvedWidth = typeof width === 'string' || typeof width === 'number' ? String(width) : suffixWidth
          const resolvedHeight = typeof height === 'string' || typeof height === 'number' ? String(height) : suffixHeight
          const style = resolvedWidth
            ? {
                width: /\d$/.test(resolvedWidth) ? `${resolvedWidth}px` : resolvedWidth,
                maxWidth: '100%',
                height: resolvedHeight ? (/\d$/.test(resolvedHeight) ? `${resolvedHeight}px` : resolvedHeight) : 'auto',
              }
            : { maxWidth: '100%' }

          return (
            <img
              src={url}
              alt={alt ?? ''}
              loading="lazy"
              className="rounded-xl"
              style={style}
              {...props}
            />
          )
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
