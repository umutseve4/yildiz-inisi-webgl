# Star Descent

**Ski down the night slope, miss the trees, collect the stars.** It opens in the browser. No install, no download, a single `index.html` file.

[![Play now](https://img.shields.io/badge/%E2%96%B6%20Play%20now-live-FF4D4F?style=for-the-badge)](https://umutseve4.github.io/yildiz-inisi-webgl/)
[![Single file](https://img.shields.io/badge/single%20file-27%2C873%20bytes-2FD3A7?style=for-the-badge)](index.html)
[![Static tests](https://img.shields.io/badge/static%20assertions-155-4C8DFF?style=for-the-badge)](tests/qa.mjs)
[![Browser tests](https://img.shields.io/badge/Chromium%20acceptance-29-A855F7?style=for-the-badge)](tests/browser.spec.mjs)
[![CI](https://github.com/umutseve4/yildiz-inisi-webgl/actions/workflows/ci.yml/badge.svg)](https://github.com/umutseve4/yildiz-inisi-webgl/actions/workflows/ci.yml)
[![pages](https://github.com/umutseve4/yildiz-inisi-webgl/actions/workflows/pages.yml/badge.svg)](https://github.com/umutseve4/yildiz-inisi-webgl/actions/workflows/pages.yml)

The link above is not decoration. After every deployment the `pages` workflow requests the live address, checks that it returns HTTP 200, and checks that the game title and the three.js import are really present on the served page. The `ci` workflow separately verifies that the URL returns 200 for as long as this README claims a live link. If the link dies, the build breaks, not just the badge.

---

## What happens in the first 30 seconds

You open the page, press start, and the skier begins to slide down the slope. The course generates itself, so every metre you travel puts trees, rocks, stars and gates in front of you that did not exist a moment earlier. The arrow keys steer, the space bar jumps you over an obstacle.

Every star you collect raises the combo multiplier, up to eight. Hitting a tree resets the combo, cuts your speed and costs a life. When the third life is gone the run ends and your score and distance appear on screen. Both the speed and the difficulty rise as you descend, and they saturate at 1400 metres.

There are three atmospheres and you can switch between them mid run: **Night** (blue fog, long sight line), **Dawn** (orange light), **Blizzard** (heavy fog, short sight line, the hardest of the three).

## Controls

| Input | What it does |
|---|---|
| `Left` `Right` or `A` `D` | Steer |
| `Space` | Jump, you take no collision while airborne |
| `P` | Pause and resume |
| `R` | Restart the run |
| `Enter` | Start from the title screen |
| Tap the top 35% of the screen | Jump (mobile) |
| Tap the left or right side | Steer (mobile) |
| The three buttons, top right | Switch between Night, Dawn and Blizzard |

## Run it on your own machine

```bash
git clone https://github.com/umutseve4/yildiz-inisi-webgl.git
cd yildiz-inisi-webgl
npm run serve      # http://localhost:4173
```

If you want to run the tests as well:

```bash
npm install
npx playwright install --with-deps chromium
npm test           # 155 static assertions plus 29 Chromium acceptance tests
```

There is no third step. Double clicking `index.html` and opening it directly also works. The only requirement is an internet connection, because three.js comes from a CDN.

## How it is built

| Layer | What is there |
|---|---|
| Visuals | three.js 0.169.0, an `InstancedMesh` each for trees, rocks, stars and gate poles, `FogExp2` for depth, snow as 2400 particles |
| Ground | One `PlaneGeometry`, bent every frame by a height function and scrolled along with the player, which is why an endless slope does not eat memory |
| Course generation | A `mulberry32` seeded generator. The same seed gives the same course, which is what makes the tests deterministic |
| Game logic | Fully separated from rendering, written as pure functions under `window.YI`. It runs inside Node with no browser at all |
| Test hook | `window.__yi` exposes the phase, the frame counter, `forceCrash()` and `collectStar()` |
| Accessibility | `aria-pressed` on the mode buttons, `aria-label` on the canvas, a `:focus-visible` focus ring, `prefers-reduced-motion` support, and an explanatory fallback screen when WebGL is unavailable |

There is not one image, sound or model file in the repository. A tree is a cone, a rock is an icosahedron, a star is an octahedron, the skier is a capsule. The entire look comes from geometry and light.

## Where the numbers come from

| Number | Source |
|---|---|
| 27,873 byte single file | `wc -c index.html`, checked in CI against both the 122,880 byte ceiling and the figure in this README |
| 155 static assertions | the output of `node tests/qa.mjs`. CI fails if it drops below the 155 baseline or disagrees with this README |
| 29 acceptance tests | `npx playwright test`, in real Chromium on SwiftShader WebGL. CI holds the 29 baseline and its equality with this README |
| 3 atmosphere modes | `YI.C.MODES` |
| 1400 m difficulty saturation | `YI.difficultyAt` |

CI runs two jobs separately. The `qa` job checks the assertion baseline, the single file contract (no external assets, no `http://`, the three.js version pinned), the agreement between the README figures and reality, and, if the README claims a live link, that the URL really returns 200. The `browser` job downloads Chromium and actually plays through the 29 acceptance tests. The `pages` job publishes only `index.html` and the licence, then smoke tests the live address after the deployment.

## What I am not claiming

- No score persistence. The best score lives in memory only while the tab stays open.
- No sound.
- The mobile touch controls work, but the keyboard is the real target. The HUD can get cramped on small screens.
- three.js loads from a CDN, so this does not open offline.
- Tested in Chromium only. I have no evidence for Firefox or WebKit.
- No multiplayer, no level editor, no save and load. This is a single sitting descent.
- The frame rate was never measured, so I publish no performance figure.

## A note on the language

This README is in English. The game itself still speaks Turkish on screen, and that is deliberate rather than unfinished: the title, the HUD and the mode names are part of the piece. If that changes, the `pages` smoke test that greps the published page for the title has to change with it.

---

MIT licensed. Umut Sever.
