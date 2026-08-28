import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const count = await db.post.count()
    if (count > 0) {
      return NextResponse.json({ message: 'Database already has posts', count })
    }

    const samplePosts = [
      {
        title: 'Getting Started with Next.js 16',
        slug: 'getting-started-nextjs-16',
        excerpt: 'Explore the new features in Next.js 16, including improved App Router patterns, React Server Components, and enhanced developer experience.',
        content: `# Getting Started with Next.js 16

Next.js 16 brings exciting new features that make building modern web applications even more enjoyable. In this post, we'll explore the key improvements.

## What's New

### Enhanced App Router

The App Router has been significantly improved with better caching strategies and more intuitive routing patterns.

\`\`\`typescript
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <Article slug={params.slug} />
}
\`\`\`

### React Server Components

RSC support has matured, allowing you to build components that run entirely on the server while maintaining a rich interactive client experience.

### Improved Performance

- Faster builds with incremental compilation
- Better tree-shaking
- Optimized bundle splitting

## Getting Started

To create a new Next.js 16 project:

\`\`\`bash
npx create-next-app@latest my-app
\`\`\`

## Conclusion

Next.js 16 represents a significant step forward in web development.

---

*Happy coding!*`,
        tags: 'Next.js, React, Web Development',
        published: true,
        authorName: 'Alex Chen',
        readTime: 3,
      },
      {
        title: 'Designing with Tailwind CSS 4',
        slug: 'designing-tailwind-css-4',
        excerpt: 'A deep dive into Tailwind CSS 4 new features, including the CSS-first configuration, container queries, and the new color system.',
        content: `# Designing with Tailwind CSS 4

Tailwind CSS 4 introduces a paradigm shift in how we configure and use utility-first CSS.

## CSS-First Configuration

Gone is the \`tailwind.config.js\` file. In Tailwind CSS 4, configuration is done directly in your CSS.

\`\`\`css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.75 0.15 85);
  --font-display: "Inter", sans-serif;
}
\`\`\`

## New Color System

The new color system uses OKLCH color space for more perceptually uniform colors.

### Benefits of OKLCH

- More perceptually uniform than HSL
- Better control over lightness
- Wider gamut support

## Container Queries

\`\`\`html
<div class="@container">
  <div class="@sm:flex @sm:gap-4">
    <!-- Responsive within container -->
  </div>
</div>
\`\`\`

## Conclusion

Tailwind CSS 4 is a major evolution that makes the framework more powerful and easier to use.

---

*Stay stylish!*`,
        tags: 'CSS, Tailwind, Design',
        published: true,
        authorName: 'Sarah Liu',
        readTime: 4,
      },
      {
        title: 'Building a Blog with Prisma and SQLite',
        slug: 'blog-prisma-sqlite',
        excerpt: 'Learn how to build a lightweight, fast blog system using Prisma ORM with SQLite as the database backend.',
        content: `# Building a Blog with Prisma and SQLite

SQLite is an excellent choice for personal blogs. Combined with Prisma ORM, you get type-safe database access with minimal setup.

## Why SQLite?

- **Zero configuration** - no separate database server
- **Fast** - in-process database, no network overhead
- **Reliable** - ACID compliant
- **Portable** - single file database

## Setting Up Prisma

\`\`\`prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  slug      String   @unique
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
\`\`\`

## Database Operations

\`\`\`typescript
const post = await db.post.create({
  data: {
    title: 'My First Blog Post',
    slug: 'my-first-post',
    content: 'Hello, World!',
    published: true,
  },
})
\`\`\`

## Conclusion

Prisma + SQLite is a powerful combination for building content-driven applications.

---

*Build something amazing!*`,
        tags: 'Prisma, SQLite, Database',
        published: true,
        authorName: 'Alex Chen',
        readTime: 3,
      },
      {
        title: 'The Art of Minimalist Design',
        slug: 'art-of-minimalist-design',
        excerpt: 'Exploring the principles of minimalist design and how to create beautiful, clean interfaces.',
        content: `# The Art of Minimalist Design

Minimalism in design isn't about removing everything — it's about removing the unnecessary so the necessary can speak.

## Core Principles

### 1. White Space is Your Friend

Don't fear empty space. White space gives your content room to breathe.

### 2. Typography Matters

In minimalist design, typography does the heavy lifting.

### 3. Limit Your Palette

A restrained color palette creates cohesion.

### 4. Every Element Has Purpose

If an element doesn't serve a clear purpose, remove it.

## Color Psychology

For a warm, inviting blog:
- **Soft yellows** convey optimism and warmth
- **Whites** create clean, open spaces
- **Warm grays** add sophistication

\`\`\`
Good design is as little design as possible.
— Dieter Rams
\`\`\`

## Conclusion

Minimalist design is not a style — it's an approach.

---

*Simplify, then simplify again.*`,
        tags: 'Design, UI/UX, Minimalism',
        published: true,
        authorName: 'Sarah Liu',
        readTime: 3,
      },
      {
        title: 'GitHub Pages Deployment Guide',
        slug: 'github-pages-deployment',
        excerpt: 'Step-by-step guide to deploying your Next.js blog to GitHub Pages for free hosting.',
        content: `# GitHub Pages Deployment Guide

Deploying your Next.js blog to GitHub Pages is a great way to share your work — for free.

## Setup Steps

### 1. Initialize Git

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
\`\`\`

### 2. Create GitHub Repository

Create a new repository on GitHub.

### 3. Configure Next.js for Static Export

\`\`\`javascript
// next.config.js
module.exports = {
  output: 'export',
  images: { unoptimized: true },
}
\`\`\`

### 4. Deploy with GitHub Actions

\`\`\`yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
\`\`\`

## Custom Domain

1. Add a \`CNAME\` file with your domain
2. Configure DNS settings
3. Enable HTTPS in GitHub settings

## Conclusion

GitHub Pages provides an excellent free hosting solution for blogs.

---

*Ship it!*`,
        tags: 'GitHub, Deployment, Tutorial',
        published: true,
        authorName: 'Alex Chen',
        readTime: 4,
      },
    ]

    for (const post of samplePosts) {
      await db.post.create({ data: post })
    }

    return NextResponse.json({ message: 'Sample posts created successfully', count: samplePosts.length })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}