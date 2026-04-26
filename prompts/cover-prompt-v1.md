Use the attached image as the base image.

Create a [FORMAT_DESC] cover by editing the base image and adding only a premium editorial typographic overlay.

Do not retouch, recolor, relight, crop, replace, blur, beautify, or alter the base photo. Preserve the person, face, skin, hair, expression, body, clothing, hands, background, lighting, framing, camera angle, atmosphere, and all photographic details exactly as they are.

Title to render:
"[TITLE]"

Default visual direction:
Premium editorial cover, psychology/motherhood theme, contemporary podcast-cover feel.

Reference accent color:
[ACCENT_NAME] [ACCENT_HEX].

CRITICAL TEXT RULES:
Render the title exactly as written, except for square brackets.

Square brackets are markup instructions only. Do not render the characters "[" or "]" in the final image.

Any text inside square brackets is the marked highlight span.

Example:
Input title: "Mas é [só pedir]"
Final visible text: "Mas é só pedir"
Highlighted span: "só pedir"

Do not translate, correct, rewrite, reorder, duplicate, remove words, force all caps, invent punctuation, or change accents/spelling.

Line breaks may change, but each line must contain consecutive words and the full reading order must reconstruct the visible title exactly.

BRACKET MARKUP RULE:
If the title contains square brackets, the text inside the brackets must receive the special highlighted treatment.

The brackets themselves must never appear.

The marked span must remain together as one semantic unit.

The marked span may receive:
- accent-color text;
- or a contrast rectangle behind it;
- or both, depending on contrast.

If brackets are present, prioritize the bracketed span over automatic semantic guessing.

If there are no brackets, choose the highlighted span semantically using the rules below.

SEMANTIC ART DIRECTION:
Before placing the text, interpret the title semantically.

Identify:
- setup: the part that prepares the idea;
- central concept: the strongest, most clinical, symbolic, memorable, or conceptual word/expression;
- punchline span: a consecutive word or phrase carrying emotional impact;
- closure: an emotional, poetic, intimate, human, or contextual complement.

If the title contains square brackets, the bracketed text is the central concept or punchline span.

The accent color must go on the central concept, punchline span, or bracketed span, not automatically on the last word.

If the emotional meaning depends on a full expression, keep the full expression together and apply the accent color to every word in it.

Examples:
- Input: "Mas é [só pedir]"
  Visible text: "Mas é só pedir"
  "Mas é" is setup.
  "só pedir" is the highlighted punchline span and must stay together.

- Input: "[Hipervigilância] materna"
  Visible text: "Hipervigilância materna"
  "Hipervigilância" is the highlighted central concept.
  "materna" is emotional closure.

- Input: "Cuidar de si [não é egoísmo]"
  Visible text: "Cuidar de si não é egoísmo"
  "Cuidar de si" is setup.
  "não é egoísmo" is the highlighted punchline span.

- Input: "Não pensa num [elefante] na sua casa"
  Visible text: "Não pensa num elefante na sua casa"
  "elefante" is the highlighted central image/concept.

LINE BREAKS:
Break the visible title into 2 or 3 lines when possible, or 4 compact lines only if the title is long and readability requires it.

Use natural reading rhythm, balanced visual width, and consecutive words only.

Keep the bracketed span together. Do not split bracketed text across unrelated lines unless absolutely necessary for readability.

Do not leave weak connectors alone.

Use compact editorial stacking:
- lines should feel connected as one typographic block;
- avoid excessive vertical spacing;
- avoid detached subtitle behavior;
- avoid generic centered stacking;
- for long titles, reduce scale slightly rather than pushing the final line into the bottom unsafe area.

TYPOGRAPHY:
Use premium editorial typography, not generic social media text.

Primary font style:
heavy geometric sans, warm editorial personality, black/heavy weight, slightly expanded width, softly rounded corners, not condensed, not industrial, not corporate cold.

Reference feel:
Sharp Grotesk Black, Avenir Black, Avenir Next Heavy, Gotham Black, Proxima Nova Black, Brandon Grotesque Black.

Avoid:
Druk Wide, Integral CF, Komu A, Helvetica/Arial generic look, aggressive condensed type, industrial poster type, corporate typography.

Use elegant italic serif only when there is a true emotional/poetic/human closure word or line.

Reference feel:
Playfair Display Italic, Cormorant Garamond Italic, Lora Italic, Bodoni-like editorial italic.

The closure line, when present, should be elegant, fluid, emotionally soft, and close to the main block. It should feel like an editorial subtitle integrated into the composition, not a separate caption.

COLOR RULES — FLAT FILL IS ABSOLUTE:
Letter fill means the real solid color inside the letter shapes.

The interior of every letter must be perfectly flat, solid, uniform, and single-color.

Use pure flat white letter fill for setup and closure.

Use an adaptive flat accent color for the central concept, punchline span, or bracketed span, based on [ACCENT_NAME] [ACCENT_HEX].

The accent color must appear as the actual interior fill of the selected words, not as glow, bloom, aura, shadow, contour, background, patch, rectangle, box, stroke, or lighting.

Never use glow, background, patch, shadow, stroke, or outline to simulate letter color.

If a word should be in the accent color, the letter interiors themselves must be flat accent color.
If a word should be white, the letter interiors themselves must be flat white.

The letter fill is a locked flat vector layer.

No effect may alter the interior of the glyphs.

Forbidden inside the letters:
- gradient fill;
- vertical gradient;
- horizontal gradient;
- radial gradient;
- color transition;
- lighting variation;
- bevel;
- emboss;
- inner glow;
- inner shadow;
- shine;
- glossy effect;
- metallic effect;
- 3D lighting;
- shaded fill;
- textured fill;
- translucent fill.

Forbidden around letters:
- stroke;
- outline;
- rim;
- contour;
- border;
- sticker edge;
- colored edge;
- white edge;
- halo attached to glyphs;
- glow attached to glyph edges.

ADAPTIVE ACCENT COLOR:
The provided accent color [ACCENT_HEX] is the reference brand color, not a rigid value.

Use [ACCENT_HEX] as the starting point. If the selected text placement needs stronger contrast, adapt the accent color slightly while preserving the same hue family and brand feeling.

The final accent fill must be chosen for maximum readability and premium editorial contrast against the actual background behind the text.

Allowed adaptations:
- slightly lighter;
- slightly darker;
- slightly more saturated;
- slightly less saturated;
- slightly warmer or cooler only within the same hue family.

Not allowed:
- changing hue family;
- turning the accent into cyan, purple, green, yellow, red, or any unrelated color;
- using gradients;
- using glow to compensate for poor contrast;
- using outline/stroke to compensate for poor contrast;
- reducing readability for strict hex fidelity;
- making the accent color dull, muddy, or low contrast.

If [ACCENT_HEX] has poor contrast against the chosen background, prioritize a contrast-safe variant of [ACCENT_NAME] over exact hex fidelity.

The adapted accent must remain visually recognizable as a refined version of [ACCENT_NAME].

BRACKETED SPAN BACKING RECTANGLE:
If the title contains square brackets, create one independent backing rectangle behind the bracketed span.

The backing rectangle is mandatory for bracketed text unless the bracketed span has perfect readability without it.

The backing rectangle must be a separate solid editorial rectangle with sharp 90-degree corners placed behind the entire bracketed word or phrase.

Use sharp 90-degree corners only.
Do not use rounded corners.
Do not use a capsule.
Do not use pill shape.
Do not use soft rounded rectangle.

The backing rectangle must be behind the phrase, not around the letters.

Layer order:
1. original photo;
2. independent sharp-corner backing rectangle behind the bracketed span;
3. flat solid bracketed text on top.

The backing rectangle must be visibly larger than the bracketed phrase, with clear padding around all sides.

The backing rectangle must have real padding:
- horizontal padding before the first letter and after the last letter;
- vertical padding above accents and below descenders;
- the shape must not hug individual letter contours.

The backing rectangle must follow the bracketed phrase as one whole unit, not each letter.

The backing rectangle must:
- sit behind only the bracketed span;
- preserve the phrase as one connected semantic unit;
- have refined padding around the text;
- have sharp square corners;
- be flat, clean, and solid;
- use high contrast against both the photo background and the text fill;
- remain visually subordinate to the typography;
- never cover the face, hands, eyes, mouth, expression, or important narrative elements.

Preferred backing rectangle combinations:
- ivory/off-white rectangle with accent-color text;
- warm-white rectangle with accent-color text;
- deep accent-color rectangle with white text, only if it creates better contrast;
- very dark neutral rectangle with white or accent-color text, only if it fits the image and remains premium.

If the bracketed span uses accent-color text, prefer an ivory/off-white or warm-white rectangle behind it when the background is dark, brown, dense, or textured.

If the bracketed span uses white text, prefer a deep accent-color or dark neutral rectangle behind it only when needed.

The backing rectangle color must be chosen to maximize:
1. contrast between photo background and backing rectangle;
2. contrast between backing rectangle and text fill;
3. harmony with [ACCENT_NAME] [ACCENT_HEX];
4. premium editorial appearance.

The backing rectangle must not:
- appear as an outline around letters;
- appear as a stroke around letters;
- trace individual glyph contours;
- follow the exact shape of the letters;
- hug the letters without padding;
- appear behind the entire title by default;
- become a large banner;
- become a full-width strip;
- touch the frame edges;
- look like a sticker;
- look like a CTA button;
- look like a UI component;
- use gradients;
- use transparency that harms readability;
- use heavy shadows;
- use stroke or outline;
- use rounded corners;
- use capsule shape;
- use pill shape.

If you are about to create an outline around the letters, do not do that. Create one separate sharp-corner rectangle behind the full bracketed phrase instead.

If a backing rectangle is used, all text on top of it must still use flat, solid, uniform letter fill.

Do not use glow, gradients, bevel, inner shadow, stroke, rim, contour, or outline inside the backing rectangle or on the letters.

CONDITIONAL BACKING RECTANGLE WITHOUT BRACKETS:
If the title has no square brackets, do not use a backing rectangle by default.

Use one independent backing rectangle only when the semantic central concept or punchline span would have poor readability because it sits over a dense, dark, busy, textured, low-contrast, or visually noisy area.

If used without brackets, the backing rectangle must follow the same rules above and appear only behind the highlighted span.

NO BACKING SHAPES BY DEFAULT:
The typography must normally sit directly on the photo.

Exception:
One clean independent editorial backing rectangle is allowed:
- behind the bracketed span;
- or behind the central concept/punchline span when contrast is genuinely insufficient.

Do not use a backing rectangle as decoration. Use it only as a functional contrast solution.

NO DECORATIVE GRAPHIC ELEMENTS:
Do not add any decorative line, divider, separator, underline, stroke bar, horizontal rule, vertical rule, frame, bracket, accent line, graphic mark, or ornamental element.

The typographic overlay must contain only:
- the visible title text itself;
- and, only if needed or explicitly marked with brackets, one functional independent backing rectangle behind the highlighted span.

Do not place a line under the text.
Do not place a separator below the text.
Do not add bars, rules, markers, flourishes, icons, arrows, frames, or layout decorations.

TEXT SEPARATION — SUBTLE SUPPORT ONLY:
Text separation must be achieved primarily through:
1. intelligent placement;
2. strong flat letter fill;
3. adaptive accent color contrast;
4. clean editorial hierarchy;
5. bracketed backing rectangle when explicitly marked;
6. conditional independent backing rectangle only when necessary for the highlighted span.

Do not make glow, haze, shadow, outline, stroke, patch, or effects the main source of readability.

If extra separation is needed, use only an extremely subtle soft grounding shadow behind the full text block or behind the backing rectangle.

The shadow must:
- be soft;
- be diffuse;
- be very low opacity;
- be non-directional;
- stay close behind the text or backing rectangle;
- support readability;
- remain invisible as a separate effect.

The shadow must not:
- create a dark band;
- create a visible cast shadow;
- create a heavy drop shadow;
- create a black haze;
- darken the area below the text;
- look like a Canva shadow;
- look like an outline;
- compete with the typography.

No glow is required.
No luminous patch is allowed.
No decorative background patch is allowed.
No letter outline is allowed.
No text stroke is allowed.

If there is a conflict between clean flat typography and effects, prioritize clean flat typography.

Forbidden color behavior:
- white letters with colored glow;
- white letters with accent-color glow;
- accent words rendered as white letters with accent glow;
- accent color appearing only as aura/glow;
- colored glow around white words;
- punchline in white with colored glow;
- color-matched glow replacing letter color;
- different glow colors per word;
- neon glow;
- hard outline;
- visible stroke;
- sticker effect.

SMART EDITORIAL PLACEMENT:
Analyze the image before placing the typography.

Do not choose placement only because there is empty space.

Do not place the title at the very top just because the wall is empty.

Prefer a compact lower-middle or mid-lower editorial block when it can sit over clothing, torso, darker background, soft shadow, or a natural contrast area without covering the face.

Important:
Lower-third does not mean bottom-third. Do not push the text toward the bottom edge.

Choose the area that best combines:
- safety;
- contrast;
- editorial presence;
- emotional relation to the image;
- visual breathing room;
- low noise;
- a sense that the text is anchored in the scene;
- Instagram safe zone compatibility.

Never cover:
face, eyes, mouth, expression, important hands, important body gesture, child's face, key emotional element, or narrative object.

Prefer:
torso/clothing area when contrast works, lower-left safe area, lower-center safe area, mid-left safe area, calm wall space only if it gives strong editorial presence, soft shadow, medium/dark background, uncluttered bedding/wall/background, or an area that feels like "cover paper".

Avoid:
extreme top placement, extreme bottom placement, bright windows, white tiles, overexposed areas, very bright walls when white text is dominant, busy textures, faces, hands, lower cluttered action areas, and areas that make the text feel detached from the person.

Exception:
A light background can work if the dominant text is in the accent color and white text is only a smaller delicate closure, but readability must come from contrast-safe flat fills, not from a hard outline or decorative backing shape.

INSTAGRAM SAFE ZONE:
The typography must be composed for Instagram safe zones, not only for the raw image.

Keep all important typography inside the central safe area of the frame.

Avoid placing essential words in:
- the extreme top area;
- the extreme bottom area;
- the right-side vertical UI zone where Reels buttons may appear;
- the bottom caption/profile/audio area;
- frame edges;
- areas likely to be cropped or hidden in Instagram feed previews.

Bottom safety rule:
The lowest word of the typography must remain comfortably above the lower Instagram UI/caption area. Do not let the final line sit near the bottom edge.

For lower compositions:
place the block in the lower-middle safe area, not in the extreme bottom. The final line must have clear breathing room below it.

If the text block is tall or has many lines, move the whole block upward or reduce the overall scale slightly instead of letting the last line fall into the bottom unsafe zone.

Do not allow descenders, accents, glow, shadow, backing shapes, rectangles, or decorative elements to touch or approach the bottom edge.

Right-side safety rule:
Avoid placing important words in the right vertical UI zone. Keep the main text block and any backing rectangle away from the area where like/comment/share buttons appear.

Crop safety rule:
The title must survive a 4:5 feed preview crop. Keep the most important words inside the central vertical crop-safe region.

Safe-zone priority order:
1. protect face and emotional/narrative elements;
2. keep text inside Instagram safe area;
3. keep the lowest line above the bottom UI/caption zone;
4. avoid the right-side Reels UI button column;
5. preserve contrast and readability;
6. maintain premium editorial composition.

EDITORIAL STACKING:
Use tight editorial stacking. Lines should feel connected as one designed typographic block.

Allow controlled scale contrast:
- setup line: large and bold;
- connector words: smaller but aligned with the dominant word;
- central concept or punchline: largest and most visually dominant;
- closure line: elegant italic serif, fluid, close to the main block, emotionally cinematic.

The central concept or punchline should be the anchor of the block.

For long titles:
keep the block compact, reduce line spacing, and control scale so the block does not invade the bottom unsafe area.

If a backing rectangle is used, keep it aligned with the typographic rhythm and fitted to the highlighted span.

Avoid:
evenly spaced generic lines, detached subtitle behavior, excessive spacing, random placement, and text that feels like a template.

SCALE AND RHYTHM:
Use editorial rhythm.

Reduce the overall typography scale by approximately 20% compared to an oversized social-media thumbnail style.

The text must remain strong and readable, but not huge.

The main line should dominate without crushing the image.

The text block should feel compact, anchored, and intentional.

The closure may be large enough to feel dramatic, but still softer than the main concept.

For tall text blocks:
prefer a slightly smaller but safer composition over a huge composition that reaches the bottom UI area.

Avoid:
oversized typography, giant headline behavior, vertical stretching, artificial font distortion, warped letters, overly rigid stacking, excessive spacing, and text touching image edges.

FINAL IMAGE:
Generate the edited image directly.

Do not show the prompt.
Do not add explanations.
The final output must be the finished premium editorial cover image.
