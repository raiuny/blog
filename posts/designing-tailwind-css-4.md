---
title: "Designing with Tailwind CSS 4"
slug: "designing-tailwind-css-4"
excerpt: "A deep dive into Tailwind CSS 4 new features, including the CSS-first configuration, container queries, and the new color system."
tags: "CSS, Tailwind, Design"
author: "Sarah Liu"
published: true
date: "2026-08-28"
---

# Designing with Tailwind CSS 4

Tailwind CSS 4 introduces a paradigm shift in how we configure and use utility-first CSS.

## CSS-First Configuration

Gone is the `tailwind.config.js` file. In Tailwind CSS 4, configuration is done directly in your CSS.

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.75 0.15 85);
  --font-display: "Inter", sans-serif;
}
```

## New Color System

The new color system uses OKLCH color space for more perceptually uniform colors.

### Benefits of OKLCH

- More perceptually uniform than HSL
- Better control over lightness
- Wider gamut support

## Container Queries

```html
<div class="@container">
  <div class="@sm:flex @sm:gap-4">
    <!-- Responsive within container -->
  </div>
</div>
```

## Conclusion

Tailwind CSS 4 is a major evolution that makes the framework more powerful and easier to use.

---

*Stay stylish!*
