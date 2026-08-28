'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3 w-3" />
            Personal Tech Blog
          </motion.div>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Thoughts, Stories &{' '}
            <span className="bg-gradient-to-r from-primary via-chart-3 to-primary bg-clip-text text-transparent">
              Ideas
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            A minimalist blog about web development, design, and technology.
            Built with Next.js and deployable to GitHub Pages.
          </p>
        </motion.div>
      </div>
    </section>
  )
}