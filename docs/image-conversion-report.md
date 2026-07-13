# NIGHTSHOT image conversion report

Validation date: 2026-07-13

The active conversions under `assets/media/images/` were measured without rerunning `optimize_images.ps1`. Acceptance requires an existing WebP file that is smaller than its retained JPG, JPEG, or PNG source. Every active WebP URL was also checked after percent-decoding for file existence, exact filename casing, and a valid RIFF/WebP container signature.

| Original path | WebP path | Original format | Original size (bytes) | WebP size (bytes) | Bytes saved | Saved | Accepted | `index.html` references WebP | Manual visual review required |
|---|---|---:|---:|---:|---:|---:|---|---|---|
| `assets/media/images/environments/Captura de pantalla 2026-06-11 194947.png` | `assets/media/images/environments/Captura de pantalla 2026-06-11 194947.webp` | PNG | 259,082 | 161,914 | 97,168 | 37.50% | Yes | Yes | Yes |
| `assets/media/images/environments/Captura de pantalla 2026-06-11 194933.png` | `assets/media/images/environments/Captura de pantalla 2026-06-11 194933.webp` | PNG | 668,196 | 369,514 | 298,682 | 44.70% | Yes | Yes | Yes |
| `assets/media/images/visuals/Captura de pantalla 2026-06-11 194321.png` | `assets/media/images/visuals/Captura de pantalla 2026-06-11 194321.webp` | PNG | 376,769 | 204,686 | 172,083 | 45.67% | Yes | Yes | Yes |
| `assets/media/images/visuals/1-final.JPEG` | `assets/media/images/visuals/1-final.webp` | JPEG | 514,027 | 152,800 | 361,227 | 70.27% | Yes | Yes | Yes |
| `assets/media/images/visuals/2-final.PNG` | `assets/media/images/visuals/2-final.webp` | PNG | 1,085,610 | 624,170 | 461,440 | 42.51% | Yes | Yes | Yes |
| `assets/media/images/artworks/Captura de pantalla 2026-06-11 194336.png` | `assets/media/images/artworks/Captura de pantalla 2026-06-11 194336.webp` | PNG | 1,122,083 | 600,388 | 521,695 | 46.49% | Yes | Yes | Yes |
| `assets/media/images/artworks/Captura de pantalla 2026-06-11 194407.png` | `assets/media/images/artworks/Captura de pantalla 2026-06-11 194407.webp` | PNG | 951,838 | 527,090 | 424,748 | 44.62% | Yes | Yes | Yes |
| `assets/media/images/artworks/Captura de pantalla 2026-06-11 194401.png` | `assets/media/images/artworks/Captura de pantalla 2026-06-11 194401.webp` | PNG | 321,017 | 166,286 | 154,731 | 48.20% | Yes | Yes | Yes |
| `assets/media/images/artworks/1.JPEG` | `assets/media/images/artworks/1.webp` | JPEG | 364,310 | 61,038 | 303,272 | 83.25% | Yes | Yes | Yes |
| `assets/media/images/artworks/installatiosn.JPEG` | `assets/media/images/artworks/installatiosn.webp` | JPEG | 97,909 | 16,930 | 80,979 | 82.71% | Yes | Yes | Yes |
| `assets/media/images/camera/Captura de pantalla 2026-06-11 194437.png` | `assets/media/images/camera/Captura de pantalla 2026-06-11 194437.webp` | PNG | 207,549 | 99,122 | 108,427 | 52.24% | Yes | Yes | Yes |
| `assets/media/images/camera/SaveClip.App_649621131_18319161811264589_5853546863548978061_n.jpg` | `assets/media/images/camera/SaveClip.App_649621131_18319161811264589_5853546863548978061_n.webp` | JPG | 123,250 | 90,108 | 33,142 | 26.89% | Yes | Yes | Yes |
| `assets/media/images/about/aboutme.JPEG` | `assets/media/images/about/aboutme.webp` | JPEG | 134,756 | 18,922 | 115,834 | 85.96% | Yes | Yes | Yes |
| `assets/media/images/about/aboutme2.JPEG` | `assets/media/images/about/aboutme2.webp` | JPEG | 271,867 | 87,760 | 184,107 | 67.72% | Yes | Yes | Yes |

## Totals

- Total original size: **6,498,263 bytes**
- Total accepted WebP size: **3,180,728 bytes**
- Total bytes saved: **3,317,535 bytes**
- Total reduction: **51.05%**
- Accepted conversions: **14**
- Rejected conversions: **0**
- Missing conversions: **0**
- References already correct before this validation: **14**
- References updated during this validation: **0**
- Incomplete `*.webp.tmp` files found: **0**

All 14 original JPG, JPEG, and PNG files remain present as temporary review fallbacks. No active HTML, CSS, or JavaScript reference remains pointed at those originals. Manual browser review is still required to confirm visual fidelity, transparency where applicable, and unchanged rendered dimensions.
