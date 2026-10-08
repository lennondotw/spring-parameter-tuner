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
- Target, Normalize, Reset, and panel-header buttons share critically damped hover springs (ω = 80 in, ω = 40 out). Reversals preserve numeric color progress and analytical velocity on the shared animation frame; reduced motion snaps to the target. Filled buttons also strengthen the background slightly while pressed, using the same 80/1 in and 40/1 out springs with velocity handoff; pointer cancellation, Space/Enter, and blur release the feedback. Panel headers animate only their existing foreground colors and keep a transparent background.
- A separate, initially collapsed Spring details panel includes Idle / Running / Settled status plus run/generation, analytical current velocity, fixed initial velocity/source, start/target values, signed target distance, generation elapsed time, and restart reasons. Runs begin after idle/settled; generations count actual replacement starts within uninterrupted motion. The last generation remains visible after settling.
- Live playback has its own physics hook, separate from UI springs. It samples analytical velocity on the shared animation frame instead of estimating from callback arrival times; the Velocity handoff switch controls whether each replacement inherits that velocity.
- Advanced groups Initial conditions and Settling thresholds. Speed units are Normalized (default, %/s) or Absolute (units/s), independently of direction: Zero, Toward target (default, magnitude slider 0–10000), or Fixed direction (signed slider −10000–10000). In Normalized mode, 2000%/s means 2000 units/s for 0 → 100, or 200 units/s for 0 → 10. Absolute mode uses the configured speed regardless of distance. Switching units preserves the numeric setting; on the canonical 0 → 100 response curve both scales are numerically equivalent. Direction appears before speed units. Zero hides both speed units and the slider, displays 0 units/s, and retains the unit and value for switching back. A non-zero configured launch speed disables velocity handoff and ruler dragging, while clicks and target shortcuts remain available. Selecting Zero or setting speed to 0 restores dragging and the previous handoff preference. With zero configured speed, interruptions inherit actual units/s when handoff is enabled, or start from rest when it is disabled. Non-zero speeds resolve from the current position and new target. Editing speed, units, or direction updates the curve; changes in handoff availability also apply to live playback. Reset restores Normalized, Toward target, and magnitude 0; Normalize preserves initial conditions. These settings stay local like the rest thresholds. The curve includes negative excursions and velocity-driven overshoot in its vertical range; absolute rest thresholds can still produce different settling times across travel distances.
- `useSpringValueWithVelocityHandoff(initialValue)` for buttons and other UI elements exposes a `MotionValue`, `setTarget(target, { omega, zeta, mass?, restDelta?, restSpeed? })`, and `jump(target)`. Target or parameter changes inherit position and analytical velocity; identical requests retain the running animation. Pending starts are coalesced per frame and cancelled on unmount, while reduced motion settles to the latest target.
- Each target button owns half the horizontal grid gap on either side, including the row's outer edges. The transparent hit layer preserves the visible button and its vertical bounds.
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
