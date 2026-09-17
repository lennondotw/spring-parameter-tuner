# Spring Parameter Tuner

An interactive tool for tuning spring animation parameters. Adjust physical or perceptual values and instantly preview the animation behavior.

## Demo

Visit the live demo: https://lennondotw.github.io/spring-parameter-tuner/

## Features

- **Physical parameters**: stiffness, damping, mass
- **Perceptual parameters**: natural frequency (ω), damping ratio (ζ)
- Animated response curve and estimated settling time, with configurable rest distance and speed
- Live target playback with optional velocity preservation
- Click or drag the ruler to interrupt playback; target updates are coalesced per animation frame
- Global Q W E R T Y U I O P [ shortcuts for targets 0–100
- Normalize mass to 1 without changing the response
- Shareable stiffness, damping, and mass in the URL; default values are omitted
- System light/dark appearance and collapsible panels, remembered in localStorage under `spring-tuner.panels`

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

## Implementation notes

- Parameter sliders keep a smooth internal position and publish quantized values with hysteresis.
- Curve targets update at most every 50 ms; the curve and time axis animate with a critically damped spring (ω = 30, ζ = 1). Interrupted transitions retain the displayed position and velocity; time-axis velocity is constrained to keep each transition monotonic.
- URL updates are throttled to 200 ms. Reset and Normalize cancel pending writes before updating the URL.
- Nunito 600 is used only for the title, with preload and `font-display: optional`.
- The Phosphor patch adds `.js` extensions to the two imported icon declarations for NodeNext resolution. Keep `patches/` with the lockfile when installing or deploying.

## Spring Parameters Explained

| Parameter         | Symbol | Effect                                                 |
| ----------------- | ------ | ------------------------------------------------------ |
| Stiffness         | k      | Higher = faster oscillation, stronger restoring force  |
| Damping           | c      | Higher = less bounce; excessive damping slows response |
| Mass              | m      | Higher = more inertia                                  |
| Natural frequency | ω      | ω = √(k/m), controls animation speed                   |
| Damping ratio     | ζ      | <1 bouncy, =1 critical, >1 overdamped                  |

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
