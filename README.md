# Spring Parameter Tuner

An interactive tool for tuning spring animation parameters. Adjust physical or perceptual values and instantly preview the animation behavior.

## Demo

Visit the live demo: https://lennondotw.github.io/spring-parameter-tuner/

## Features

- **Physical parameters**: stiffness, damping, mass
- **Perceptual parameters**: natural frequency (ω), damping ratio (ζ)
- Real-time animation preview
- Shareable URL with parameters encoded
- Preset values for quick testing

## Development

The project uses Node.js 24 and pnpm 12.

```sh
corepack enable
pnpm install
pnpm dev
```

Run the full local verification suite with:

```sh
pnpm check
```

To publish the current build to GitHub Pages from your machine:

```sh
pnpm run deploy
```

## Spring Parameters Explained

| Parameter         | Symbol | Effect                                                |
| ----------------- | ------ | ----------------------------------------------------- |
| Stiffness         | k      | Higher = faster oscillation, stronger restoring force |
| Damping           | c      | Higher = less bounce, faster settling                 |
| Mass              | m      | Higher = more inertia                                 |
| Natural frequency | ω      | ω = √(k/m), controls animation speed                  |
| Damping ratio     | ζ      | <1 bouncy, =1 critical, >1 overdamped                 |

## Using with Animation Libraries

The spring parameters from this tool can be directly applied to [Popmotion](https://popmotion.io/) and [Motion](https://motion.dev/) (formerly Framer Motion).

**Popmotion**

```ts
import { animate } from 'popmotion';

animate({
  from: 0,
  to: 100,
  type: 'spring',
  stiffness: 400,
  damping: 40,
  mass: 1,
});
```

**Motion**

```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 40,
    mass: 1,
  }}
/>
```

## License

MIT
