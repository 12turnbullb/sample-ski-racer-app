# Beek Racing - Futuristic Design System

## Color Palette

### Primary Colors
- **Ice Blue**: `#0ea5e9` - Primary brand color
- **Cyan**: `#06b6d4` - Secondary brand color  
- **Neon Cyan**: `#00ffff` - Accent/highlights
- **Neon Blue**: `#0080ff` - Interactive elements
- **Purple**: `#8b5cf6` - Gradient accents

### Carbon (Dark Theme)
- **Carbon 950**: `#020617` - Darkest background
- **Carbon 900**: `#0f172a` - Primary background
- **Carbon 800**: `#1e293b` - Secondary background
- **Carbon 700**: `#334155` - Tertiary background

### Ice (Light Accents)
- **Ice 50-400**: Light blues for text and borders
- Use for secondary text, borders, and subtle highlights

## Component Patterns

### Glassmorphism Cards
```tsx
className="glass-dark rounded-2xl shadow-glass border border-white/10 p-6"
```

### Primary Buttons
```tsx
className="px-6 py-3 bg-gradient-ice text-white rounded-xl font-semibold hover:shadow-neon-blue transition-all"
```

### Secondary Buttons
```tsx
className="px-6 py-3 glass-dark text-ice-200 rounded-xl font-semibold border border-white/10 hover:bg-white/10 transition-all"
```

### Input Fields
```tsx
className="w-full px-4 py-3 glass-dark border border-white/10 rounded-xl text-white placeholder-ice-400 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 transition-all"
```

### Loading Spinners
```tsx
<div className="relative w-20 h-20">
  <div className="absolute inset-0 border-4 border-ice-500/20 rounded-full"></div>
  <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin"></div>
  <div className="absolute inset-2 border-4 border-transparent border-t-ice-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
</div>
```

### Error Messages
```tsx
className="glass-dark border border-red-500/30 rounded-2xl p-4"
```

### Success Messages
```tsx
className="glass-dark border border-green-500/30 rounded-2xl p-4"
```

## Typography

### Headings
- Use `gradient-text` class for main headings
- Font weights: `font-bold` or `font-semibold`
- Sizes: `text-3xl` to `text-8xl` for hero text

### Body Text
- Primary: `text-white`
- Secondary: `text-ice-200` or `text-ice-300`
- Muted: `text-ice-400`

## Animations

### Available Animations
- `animate-fadeIn` - Fade in with scale
- `animate-slide-in-up` - Slide from bottom
- `animate-slide-in-right` - Slide from right
- `animate-slide-in-left` - Slide from left
- `animate-float` - Floating motion
- `animate-pulse-glow` - Pulsing glow effect
- `animate-shimmer` - Shimmer effect

### Hover Effects
- Use `card-hover` class for cards
- `hover:shadow-neon-blue` for buttons
- `hover:scale-105` for icons and small elements

## Spacing

- Container max-width: `max-w-7xl`
- Section padding: `p-6` or `p-8`
- Gap between elements: `gap-4` or `gap-6`
- Rounded corners: `rounded-xl` or `rounded-2xl`

## Special Effects

### Grid Pattern Background
```tsx
className="grid-pattern opacity-30"
```

### Mesh Gradient Background
```tsx
className="bg-mesh-gradient"
```

### Floating Orbs
```tsx
<div className="absolute top-20 left-10 w-72 h-72 bg-ice-500/20 rounded-full blur-3xl animate-float"></div>
```

### Neon Text
```tsx
className="neon-text"
```

## Accessibility

- Always include focus states with `focus:ring-2 focus:ring-neon-cyan`
- Use `focus:ring-offset-2 focus:ring-offset-carbon-900` for dark backgrounds
- Maintain WCAG AA contrast ratios
- Include aria-labels for interactive elements
