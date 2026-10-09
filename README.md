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
- Advanced groups Initial velocity and Settling thresholds. Initial velocity offers Zero (default) or Toward target. Toward target uses a nonnegative normalized speed (%/s, slider 0–10000): 2000%/s means 2000 units/s for 0 → 100 or 200 units/s for 0 → 10, with direction determined by the current position and target. Zero hides the speed control, displays 0 units/s, and retains the value for switching back. Clicks, target shortcuts, and ruler dragging work with any configured speed and either handoff setting. With handoff on, an interrupted spring inherits actual units/s, including its sign, without rescaling for the new target distance; idle or settled springs launch with the configured normalized speed. With handoff off, every new spring resolves the configured speed from its current position toward the new target. Drag updates follow the same rule, and release only flushes the final target without restarting an unchanged target. Editing speed or mode updates the response curve and applies to the next spring without restarting active motion. The curve always shows the configured launch response, so an interrupted live spring with inherited velocity may differ. Reset restores Zero and speed 0; Normalize preserves initial velocity. These settings are in memory only and return to Zero and speed 0 on refresh. The curve includes velocity-driven overshoot; absolute rest thresholds can produce different settling times across travel distances.
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
