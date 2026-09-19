# UniPred website

A standalone static research website. There is no build step or runtime dependency on a CDN.

## Preview

From this directory:

```sh
python3 -m http.server 8007
```

Open `http://localhost:8007`. The repository's existing GitHub Pages workflow deploys on a push to its configured branch; previewing does not publish anything.

## Content and sources

- `index.html`: ordered author list, distinct UMich CSE/CEE affiliations, contribution marks, sections, abstract, and static captions.
- `static/css/index.css`: responsive layout, locally hosted fonts, and reduced-motion styles.
- `static/js/index.js`: four-stage method walkthrough, illustrative feature-space animation, domain/clip selection, lazy video metadata loading, playback management, mobile menu, and citation copy.
- `static/unipred.pdf`: the September 16 manuscript snapshot from `unipred-paper/output/pdf/unipred-tro-draft.pdf`, including all 11 authors. It is copied without changing the paper. Replace it when a new manuscript is ready.
- `static/images/method/state-{0,1,2,3}.png`: original state crops extracted from the paper's `imgs/Fig6.pdf` (the unified bilevel learning figure). State 2 holds a towel; the other states show an empty gripper.
- `static/videos/web/`: browser-compatible H.264 derivatives of all 11 original demonstration/recovery/failure clips. Original footage in `static/videos/` remains intact. Web copies preserve duration and source speed annotations and are capped at 1280 px wide.
- `static/images/posters/`: video poster frames. Each poster uses its video's basename.
- `static/fonts/`: self-hosted DM Sans and Manrope, with their SIL Open Font Licenses.

The manuscript reports five simulated domains and two real-robot domains, ten evaluation tasks per real domain, and 20 teleoperated demonstrations per real domain. The feature-space animations and predicate examples illustrate the method; they are not logged embeddings, measurements, or a synchronized robot state trace. At test time the LLM is not directly commanding the robot. Learned predicates support a symbolic planner over a provided low-level controller library.

The BibTeX entry is explicitly for arXiv:2512.17992, preserving the author metadata of that published preprint. The current manuscript's 11-author list is displayed independently above it.

### Updating demo copy or footage

Table-cleaning clips are `main_demo_1` (three toys) and `main_demo_2` (two toys). Cluttered retrieval uses `pick-clutter-hard`, `pick-clutter-mid`, and `pick-clutter-easy`. Edit the `clips` and `domains` objects in `static/js/index.js`; keep the default table-cleaning caption in `index.html` aligned with the initial clip. Recovery and failure captions are in `index.html`.

Failure explanations distinguish observed outcomes from mechanisms discussed in the paper. Use execution logs or author confirmation before assigning a definite internal cause to an individual recording.

A web encode can be regenerated with:

```sh
ffmpeg -i static/videos/CLIP.mp4 -map 0:v:0 -map '0:a?' \
  -vf 'scale=w=min(1280\,iw):h=-2' -c:v libx264 -preset fast -crf 23 \
  -pix_fmt yuv420p -c:a aac -b:a 96k -movflags +faststart \
  static/videos/web/CLIP.mp4
```

## Main overview film

`static/videos/unipred-overview.mp4` is a real 28-second H.264 video, rendered at 1440×810 and 24 fps. It has four seven-second scenes: concepts, effect hypotheses and observations, bilevel refinement, and planning with robot footage. It is silent, with on-screen text and an English `.vtt` caption track.

The editable canvas animation is `scripts/overview-scene.js`; the renderer is `scripts/render-overview.html`. To export, first start the static server. Use Node 20+, Playwright, Chrome/Chromium, and ffmpeg:

```sh
node scripts/render-overview.cjs --preview  # four PNG keyframes in /tmp/unipred-site-review/film
node scripts/render-overview.cjs            # overwrite MP4 and JPEG poster
```

Optional environment variables: `NODE_PATH` for the Playwright installation, `CHROME_PATH` for the browser executable, `FFMPEG_PATH`, and `OVERVIEW_ORIGIN` (default `http://127.0.0.1:8007`). Update the `.vtt` file when changing scene timing or narration text.

The overview plays automatically only when visible and reduced motion is not requested. All videos have native playback controls, pause offscreen, and pause when another video starts. The interactive walkthrough starts manually and has its own pause control.

## Validation

With the preview server running and Node 20+/Playwright available:

```sh
node scripts/check-site.cjs
```

The smoke check verifies author order, affiliation presence, local assets and anchors, all 12 video files, domain/clip switching, keyboard tab navigation, clipboard copying, mobile navigation, reduced-motion behavior, and viewport-based playback. It checks page overflow at 360, 390, 768, and 1440 px and saves desktop/mobile screenshots under `/tmp/unipred-site-review/`. Use `SITE_ORIGIN` and `CHROME_PATH` to override the defaults.
