# NIGHTSHOT image inventory

Audit and organization date: 2026-07-13

## Summary

- Raster files audited: **23**
- Total raster size: **12,907,652 bytes** (about **12.31 MiB**)
- Actively referenced raster files: **14**
- Apparently unused or uncertain raster files: **9**
- Exact byte-for-byte duplicates: **none** (SHA-256 comparison)
- Files used by multiple sections: **none**
- Existing WebP files: **1** (`6969c38d4fdb28d1fe960e257c1c3cbc.webp`)
- Embedded raster data in HTML, CSS, or JavaScript: **none found**
- Separately reported SVG/GIF/ICO files: **none found**
- TIFF/BMP files: **none found**

All active raster references were found in `index.html`. No raster references were found in `spook.html`, `assets/css/site.css`, or the JavaScript files under `assets/js/`.

## Raster inventory

“Current path” records the path at the beginning of this audit. “Final path” records the path after the safe organization step.

| Current path | Final path | Format | Size (bytes) | Discovered references | Section | Shared | Unused / uncertain | WebP eligible | Risks / notes |
|---|---|---:|---:|---|---|---|---|---|---|
| `26ecc27dad07ada0fa3eab802520d5bd.jpg` | unchanged | JPG | 39,609 | None | Unassigned | No | Yes | Yes | Hash-like filename; appears to be an unrelated web-design reference. Left in place. |
| `6969c38d4fdb28d1fe960e257c1c3cbc.webp` | unchanged | WebP | 36,546 | None | Unassigned | No | Yes | No—already WebP | Hash-like filename; appears to be an unrelated web-design reference. Left in place. |
| `Contenido/EJEMPLOS FILM LOOK COLOR GRANDING.png` | unchanged | PNG | 3,294,946 | None | Uncertain (possibly Artworks) | No | Yes | Yes | Large file; spaces in path; section cannot be confirmed because it is unused. |
| `imagenes web/installations.png` | unchanged | PNG | 718,531 | None | Uncertain (possibly Installations) | No | Yes | Yes | Filename and subject suggest Installations, but no current use confirms ownership. |
| `imagenes web/galeria/Captura de pantalla 2026-07-09 232505.png` | unchanged | PNG | 164,066 | None | Uncertain (Artworks or Visuals) | No | Yes | Yes | Spaces in filename; gallery image with no active reference. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 195115.png` | unchanged | PNG | 471,173 | None | Unassigned | No | Yes | Yes | Spaces in path; unused reference image. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 201109.png` | unchanged | PNG | 621,627 | None | Unassigned | No | Yes | Yes | Spaces in path; appears to be an external design reference. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 201117.png` | unchanged | PNG | 965,066 | None | Unassigned | No | Yes | Yes | Spaces in path; appears to be an external design reference. |
| `refes imagenes y video/SaveClip.App_651157168_18319161793264589_3241779776188127705_n.jpg` | unchanged | JPG | 97,825 | None | Uncertain (Camera, About, or Visuals) | No | Yes | Yes | Long punctuation-heavy filename; unused, so section ownership is ambiguous. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194947.png` | `assets/media/images/environments/Captura de pantalla 2026-06-11 194947.png` | PNG | 259,082 | `index.html:168` | Environments | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194933.png` | `assets/media/images/environments/Captura de pantalla 2026-06-11 194933.png` | PNG | 668,196 | `index.html:173` | Environments | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194321.png` | `assets/media/images/visuals/Captura de pantalla 2026-06-11 194321.png` | PNG | 376,769 | `index.html:274` | Visuals | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `imagenes web/1-final.JPEG` | `assets/media/images/visuals/1-final.JPEG` | JPEG | 514,027 | `index.html:288` | Visuals | No | No | Yes | Uppercase extension preserved. |
| `imagenes web/2-final.PNG` | `assets/media/images/visuals/2-final.PNG` | PNG | 1,085,610 | `index.html:292` | Visuals | No | No | Yes | Uppercase extension preserved. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194336.png` | `assets/media/images/artworks/Captura de pantalla 2026-06-11 194336.png` | PNG | 1,122,083 | `index.html:398` | Artworks | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194407.png` | `assets/media/images/artworks/Captura de pantalla 2026-06-11 194407.png` | PNG | 951,838 | `index.html:409` | Artworks | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194401.png` | `assets/media/images/artworks/Captura de pantalla 2026-06-11 194401.png` | PNG | 321,017 | `index.html:413` | Artworks | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `imagenes web/galeria/1.JPEG` | `assets/media/images/artworks/1.JPEG` | JPEG | 364,310 | `index.html:417` | Artworks | No | No | Yes | Generic filename; ownership is confirmed by its active Artworks reference. |
| `imagenes web/galeria/installatiosn.JPEG` | `assets/media/images/artworks/installatiosn.JPEG` | JPEG | 97,909 | `index.html:421` | Artworks | No | No | Yes | Existing spelling `installatiosn` and uppercase extension preserved. |
| `refes imagenes y video/Captura de pantalla 2026-06-11 194437.png` | `assets/media/images/camera/Captura de pantalla 2026-06-11 194437.png` | PNG | 207,549 | `index.html:482` | Camera | No | No | Yes | Spaces preserved and percent-encoded in the URL. |
| `refes imagenes y video/SaveClip.App_649621131_18319161811264589_5853546863548978061_n.jpg` | `assets/media/images/camera/SaveClip.App_649621131_18319161811264589_5853546863548978061_n.jpg` | JPG | 123,250 | `index.html:490` | Camera | No | No | Yes | Long punctuation-heavy filename preserved. |
| `imagenes web/About me/aboutme.JPEG` | `assets/media/images/about/aboutme.JPEG` | JPEG | 134,756 | `index.html:548` | About | No | No | Yes | Uppercase extension preserved. |
| `imagenes web/About me/aboutme2.JPEG` | `assets/media/images/about/aboutme2.JPEG` | JPEG | 271,867 | `index.html:551` | About | No | No | Yes | Uppercase extension preserved. |

## Reference and duplicate findings

- No active raster image is referenced from more than one section, so no file qualified for `assets/media/images/shared/`.
- SHA-256 hashes found no exact duplicate raster files.
- Visual review of the nine unused candidates found no obvious duplicate among them; several are clearly unrelated design-reference screenshots.
- Filenames with spaces remain supported through percent-encoded HTML URLs. They were not renamed.
- Mixed-case extensions, long `SaveClip.App_...` names, hash-like root filenames, and the existing `installatiosn.JPEG` spelling were preserved to avoid unnecessary filename changes.
- No query strings or URL fragments were present on raster references, so none required preservation during the moves.

## Missing and unresolved references

- No active raster reference points to a missing file.
- `index.html:527` contains a commented example reference to `your-photo.jpg`. The file does not exist, but the markup is inactive and was left unchanged rather than inventing an asset.
- The nine unused files remain in their original locations because section ownership is absent or ambiguous.

## Special image formats

No `.svg`, `.gif`, or `.ico` files were found. No special site asset was moved.

## Later WebP conversion candidates

All 22 JPEG/PNG files are technically eligible for later WebP evaluation. Conversion should prioritize the 14 actively referenced images and the largest PNG files. The unused files should not be converted until their intended use is confirmed. The existing root-level WebP file is already in the target format and is not a conversion candidate.

No image was converted, resized, recompressed, duplicated, or deleted during this audit.
