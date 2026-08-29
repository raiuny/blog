---
title: "Building a Blog with Prisma and SQLite"
slug: "blog-prisma-sqlite"
excerpt: "Learn how to build a lightweight, fast blog system using Prisma ORM with SQLite as the database backend."
tags: "Prisma, SQLite, Database"
author: "Alex Chen"
published: true
date: "2026-08-28"
---

# Building a Blog with Prisma and SQLite

SQLite is an excellent choice for personal blogs. Combined with Prisma ORM, you get type-safe database access with minimal setup.

## Why SQLite?

- **Zero configuration** - no separate database server
- **Fast** - in-process database, no network overhead
- **Reliable** - ACID compliant
- **Portable** - single file database

## Setting Up Prisma

```prisma
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
```

## Database Operations

```typescript
const post = await db.post.create({
  data: {
    title: 'My First Blog Post',
    slug: 'my-first-post',
    content: 'Hello, World!',
    published: true,
  },
})
```

## Conclusion

Prisma + SQLite is a powerful combination for building content-driven applications.

---

*Build something amazing!*
