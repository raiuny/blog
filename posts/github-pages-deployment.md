---
title: "GitHub Pages Deployment Guide"
slug: "github-pages-deployment"
excerpt: "Step-by-step guide to deploying your Next.js blog to GitHub Pages for free hosting."
tags: "GitHub, Deployment, Tutorial"
author: "Alex Chen"
published: true
date: "2026-08-28"
---

# GitHub Pages Deployment Guide

Deploying your Next.js blog to GitHub Pages is a great way to share your work — for free.

## Setup Steps

### 1. Initialize Git

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Create GitHub Repository

Create a new repository on GitHub.

### 3. Configure Next.js for Static Export

```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: { unoptimized: true },
}
```

### 4. Deploy with GitHub Actions

```yaml
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
```

## Custom Domain

1. Add a `CNAME` file with your domain
2. Configure DNS settings
3. Enable HTTPS in GitHub settings

## Conclusion

GitHub Pages provides an excellent free hosting solution for blogs.

---

*Ship it!*
