# UniPred website

A standalone static research website. There is no build step or runtime dependency on a CDN.

## Preview

From this directory:

```sh
npx --yes http-server@14.1.1 . -p 8007 -c-1
```

Open `http://localhost:8007`. This server supports HTTP byte ranges, which are required for reliable video seeking in Chromium. Avoid Python’s basic `http.server` when verifying the film or seeking to later actions. The repository's existing GitHub Pages workflow deploys on a push to its configured branch; previewing does not publish anything.

## Content and sources

- `index.html`: ordered author list, distinct UMich CSE/CEE affiliations, contribution marks, acceptance notice, sections, abstract, and all video captions. The IEEE T-RO 2026 acceptance status was supplied by the authors; no DOI or journal issue metadata has been invented.
- `static/css/index.css`: responsive layout, locally hosted fonts, and reduced-motion styles.
- `static/images/unipred-mark.svg`: a crisp vector reinterpretation of the original colorful node-network logo, used in the header, hero, footer, film, and favicon. The original `logo.png` remains available.
- `static/js/index.js`: four-step learning story with automatic playback and manual scene selection, lazy video metadata loading, independent playback of visible clips, global pause/resume, mobile menu, and citation copy.
- `static/unipred.pdf`: the September 16 manuscript snapshot from `unipred-paper/output/pdf/unipred-tro-draft.pdf`, including all 11 authors. It is copied without changing the paper. Replace it when a new manuscript is ready.
- `static/images/method/state-{0,1,2,3}.png`: original state crops extracted from the paper's `imgs/Fig6.pdf` (the unified bilevel learning figure). State 2 holds a towel; the other states show an empty gripper.
- `static/images/method/observation-top-down.png`: the actual 640×480 workspace-camera image extracted from `imgs/Fig6.pdf`, used in both the film and the inference diagram.
- `static/videos/web/`: browser-compatible H.264 derivatives of all 11 original demonstration/recovery/failure clips. Original footage in `static/videos/` remains intact. Web copies preserve duration and source speed annotations and are capped at 1280 px wide.
- `static/images/posters/`: video poster frames. Each poster uses its video's basename.
- `static/fonts/`: self-hosted DM Sans and Manrope, with their SIL Open Font Licenses.

The manuscript reports five simulated domains and two real-robot domains, ten evaluation tasks per real domain, and 20 teleoperated demonstrations per real domain. The feature-space animations and predicate examples illustrate the method; they are not logged embeddings, measurements, or a synchronized robot state trace. At test time the LLM is not directly commanding the robot. Learned predicates support a symbolic planner over a provided low-level controller library.

The homepage frames this as “an agentic approach to learning concepts from human demonstrations for long-horizon manipulation.” This is website-level framing of the existing method, not a new paper claim or title. The LLM agent proposes effect vectors, receives feedback from neural learning through the exploration history, and revises subsequent proposals. The visual loop belongs to training; inference uses the learned predicates and symbolic planner. The manuscript and its abstract are unchanged.

The BibTeX entry is explicitly for arXiv:2512.17992, preserving the author metadata of that published preprint. The current manuscript's 11-author list is displayed independently above it.

### Updating demo copy or footage

Table-cleaning clips are `main_demo_1` (three toys) and `main_demo_2` (two toys). Cluttered retrieval uses `pick-clutter-hard`, `pick-clutter-mid`, and `pick-clutter-easy`. All five demonstrations, three recoveries, and three failures are individual figures in `index.html`; no clip is hidden behind a tab. Edit the video source, poster, and adjacent caption there.

Failure explanations distinguish observed outcomes from mechanisms discussed in the paper. Use execution logs or author confirmation before assigning a definite internal cause to an individual recording.

A web encode can be regenerated with:

```sh
ffmpeg -i static/videos/CLIP.mp4 -map 0:v:0 -map '0:a?' \
  -vf 'scale=w=min(1280\,iw):h=-2' -c:v libx264 -preset fast -crf 23 \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart \
  static/videos/web/CLIP.mp4
```

## Main overview film

`static/videos/unipred-overview.mp4` is approximately 86 seconds of H.264 video at 1440×810 and 24 fps. The first 34 seconds animate four scenes: an LLM agent proposes a concept (0–8 s), demonstrations supervise learning (8–16 s), feedback returns to the agent (16–26 s), and the visual concept recognizes observations (26–34 s). Each scene plays enlarged in the center, then shrinks into its own quadrant. Previously completed panels remain visible but dimmed. At 34–40 seconds, all four panels form the complete process figure. There is no separate planning explanation scene. The final 46 seconds include the entire `main_demo_1.mp4` robot run, preserving its original speed. It is silent, with on-screen explanations and an English `.vtt` track.

The robot stream is composited directly with ffmpeg onto the execution layout. It is not reconstructed by seeking a browser video for each canvas frame. This preserves continuous motion through grasping, transfers, and wiping. The static plan structure explains the task; it is not presented as synchronized execution telemetry.

The editable canvas animation is `scripts/overview-scene.js`; the renderer is `scripts/render-overview.html`. To export, first start the static server. Use Node 20+, Playwright, Chrome/Chromium, and ffmpeg:

```sh
node scripts/render-overview.cjs --preview  # seven PNG keyframes in /tmp/unipred-site-review/film-v5
node scripts/render-overview.cjs            # overwrite MP4 and JPEG poster
```

Optional environment variables: `NODE_PATH` for the Playwright installation, `CHROME_PATH` for the browser executable, `FFMPEG_PATH`, and `OVERVIEW_ORIGIN` (default `http://127.0.0.1:8007`). Update the `.vtt` file when changing scene timing or narration text.

All visible videos play independently, muted and looping, unless reduced motion or a pause control is active. Native controls remain available. Clips pause offscreen; manually paused clips stay paused when brought back into view. The learning story starts automatically with the agent when its stage enters view (20% intersection). Each scene plays centrally and then docks into a quadrant over 1.2 seconds. All completed scenes persist; after the fourth docks, the full figure stays on screen until Replay or a scene button is selected. Full figure jumps to the assembled view. Selecting a step pauses on its enlarged scene, with preceding panels collected; Play resumes. Pause freezes both the scene/docking clock and feature/feedback motion. Reduced-motion visitors see the completed static figure by default and can explicitly replay. The standalone “From learned concepts to a robot plan” section has been removed. The navigation’s motion control pauses or resumes all motion.

## Validation

With the preview server running and Node 20+/Playwright available:

```sh
node scripts/check-site.cjs
```

The smoke check verifies author count, affiliation and acceptance notices, local assets and anchors, all 12 video files, the 86-second film, direct visibility of all five demos, uncropped state images, focused-scene layout and accumulated panels at every step, keyboard scene selection, automatic completion of all four scenes, docking transforms, four-quadrant geometry, persistent completed figure, replay, feedback animation pausing, simultaneous demo playback, global motion controls, clipboard copying, mobile navigation, reduced-motion behavior, and offscreen pausing. It checks page overflow at 360, 390, 768, and 1440 px and saves desktop/mobile screenshots under `/tmp/unipred-site-review/`. Use `SITE_ORIGIN` and `CHROME_PATH` to override the defaults.
