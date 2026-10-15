# Learning Path: Rationale for the Decisions

> As of October 14, 2026. Explains why the dovetail course is built the way it is.
> Sources: `[D n]` and `[H n]` in [recherche.en.md](recherche.en.md). Study: [studiendesign.en.md](studiendesign.en.md).
> German: [lernpfad.md](lernpfad.md).
> Code: `apps/tischler/lib/zinken/lehrgang.ts` (DE) and `lehrgang.en.ts` (EN, same ids).

## The six learning steps

| No. | id | Learning step | What the apprentice can do afterward |
|---|---|---|---|
| 1 | `holz` | Choose and prepare the wood | Mark reference faces, check the end grain, measure thickness D |
| 2 | `aufteilung` | Spacing on the center line | Set the number of tails, calculate parts, set the 1:6 slope |
| 3 | `anreissen` | Lay out — pin board first | Lay out baseline, spacing, slopes, and waste |
| 4 | `saegen` | Sawing — in the waste, vertical, down to the baseline | Saw beside the line down to the baseline |
| 5 | `stemmen` | Chopping — from both sides toward the middle | Chop out the waste to the baseline without blowout |
| 6 | `passen` | Transferring, fitting, gluing up | Transfer the pins, dry-fit, glue up |

Every step has the same parts: goal and tools, demonstration (master's commentary and 3D in slow motion), imitation (hand moves), checkpoints, common mistakes, safety, and check questions.

Sequence across media: computer (steps 1–6, calculator) → VR demonstration in slow motion → AR layout on the real board → sawing and chopping without the headset.

---

## Didactic decisions

The twelve decisions follow the twelve conclusions of the didactics research. "Status" says how far the app implements each one today.

### E1. Four-step method in every step, trainer stays involved

- **The app:** Each of the six steps runs through the four stages. Prepare = goal and tools. Demonstrate = commentary and animation. Imitate = hand moves. Practice = checkpoints and questions. When in doubt, common mistakes refer the apprentice to the trainer (for example, report a thickness that varies; fill gaps only after consulting the trainer).
- **Why:** The method is established in apprentice training and catches errors early [D 1]. Its model shows the task in small segments and then has the learner perform it [D 2]. Craft apprenticeship is also the model for cognitive apprenticeship [D 3]. The draft had spread the four stages across the media (computer, VR, AR, wood). The app puts them inside every step, because laying out, sawing, and chopping each need their own demonstrate-and-imitate round. The media sequence stays as the outer flow.
- **Status:** implemented on the computer. Correction in stage 3 stays with a person.

### E2. Demonstration with audible thinking

- **The app:** The demonstration text is written in the first person and says what the master pays attention to (for example, when sawing, watching both lines at once). Check questions ask why, for example why chopping is done from both sides.
- **Why:** Modeling means making hidden thinking visible, not just the movement. Asking why supports articulation [D 3].
- **Status:** partial. Pauses in the animation asking "What comes next?" are missing. Whether the commentary will be audible in VR is open.

### E3. The why first, then the how in the moment

- **The app:** On the computer, reasons and context (reference faces, spacing, slope, order) come before the work on wood. In AR, only brief working aids appear on the board: layout lines, saw kerfs with the waste side, chopping zones. Hand moves come in a short and a detailed version.
- **Why:** 4C/ID separates supportive information (before the task) from procedural information (in the moment of the task) [D 4]. This keeps the load low while working [D 5].
- **Status:** implemented.

### E4. Calculator as a worked example

- **The app:** Step 2 fully works the textbook example: B 140 / D 20, estimate, check with B/(1.7·D), settle on 4 tails, 13 parts, T ≈ 10.8 mm, chain check. The calculator starts with this example. Then the apprentice enters their own dimensions. They set the number of tails themselves; the formula is only a suggestion.
- **Why:** For novices, worked examples are more effective than solving right away [D 6] and lower the load [D 5].
- **Status:** partial. The middle stage (partly worked) is missing, see Ideas.

### E5. Keep VR plain

- **The app:** The VR scene shows a plain workbench (top, legs, front vise) and the workpiece in the vise. It plays the demonstration in slow motion from the apprentice's point of view. No workshop decoration.
- **Why:** In one study, more immersion brought more presence but less learning and more load [D 17]. VR pays off where it does something video cannot: perspective, slow motion, repetition [D 5].
- **Status:** implemented (first version, not tested on the headset).

### E6. Fade support step by step

- **The app:** On the computer there are three support levels: 2 = everything, 1 = keywords, 0 = goal and checkpoint only. The apprentice picks the level; it starts at level 2.
- **Why:** Constant augmented help improves practice performance and can hurt retention (guidance hypothesis) [D 10]. For complex skills, more help early on makes sense [D 11]. So the scaffold has to be there and then be removed (fading) [D 3][D 12].
- **Status:** partial. Switching does not depend on performance. The AR overlay has no fading yet, see Ideas.

### E7. Feedback on the task

- **The app:** Every check question explains the why after the answer. Checkpoints are observable (for example, no light gap at the try square, no paper fits in the gap). Common mistakes give cause and remedy.
- **Why:** Feedback works when it shows where one stands and what comes next. Praise aimed at the person is the least effective [D 9].
- **Status:** implemented.

### E8. Part-task practice on scrap

- **The app:** Common mistakes recommend practicing sawing on scrap first. Checkpoints set measurable targets (for example, D to within 0.5 mm, no overcut).
- **Why:** The associative phase only happens on real wood [D 7]. Deliberate practice with sub-goals explains differences in performance [D 8]. 4C/ID adds part-task practice to the whole task [D 4]. The practice sequence line → stop → leave the line comes from the workshop [H 20].
- **Status:** partial. A dedicated practice step is missing, see Ideas.

### E9. AR is an aid, not a measuring tool

- **The app:** The board is registered with three points. The panel shows the residual error: up to 2 mm "good", up to 5 mm "borderline", above that, register again. The limits are provisional and must be measured on the device. Layout is done with marking gauge and marking knife; the lines in the headset only show where.
- **Safety rule:** The AR headset is used only for laying out and checking. Never saw or chop with the headset on. The rule is part of the safety notes in steps 4 and 5.
- **Why:** In hard cases, Quest 3 can be off by more than 10 cm [D 26]. Passthrough is distorted at close range [D 28], and depth is judged less accurately [D 27]. No millimeter-level measurement exists for Quest 3; it is part of the study. When chopping, both hands belong behind the edge and the eyes on the edge [H 23]. Registered AR reduces follow-on errors [D 18], which is why it pays off for layout in particular.
- **Status:** implemented (first version, not tested on the headset).

### E10. Short headset sessions

- **The app:** No time limit of its own. The study and the trade-fair demo limit the duration (guideline under 20 minutes, not evidence-based) and ask about nausea.
- **Why:** Cybersickness is common and measurable [D 29]; the SSQ is the standard instrument [D 30].
- **Status:** covered in the study design, not in the app.

### E11. Measure learning separately from practice performance

- **The app:** The learning log stores practice data only: step opened, question right or wrong, support level, rough minutes. Proof of learning happens outside the app: a post-test on a real board, without the headset, with new dimensions.
- **Why:** Practice performance with help is not proof of learning [D 10]. Many studies measure only usability [D 13]. The model study WeldAR tests without help [D 22]; transfer is the main gap [D 21].
- **Status:** implemented (log); for measurement see the [study design](studiendesign.en.md).

### E12. Data protection before data collection

- **The app:** The learning log is **off by default (opt-in)**. It stores locally, without names, time of day, or device ID. Export only as a file at the push of a button; delete at any time. Passthrough and camera images are not stored.
- **Why:** Apprentices are often minors. Separate information and consent are required [D 38], plus the school's approval [D 39]. Art. 8 GDPR and § 4(4) DSG are not the legal basis of the study [D 36][D 37]. "Local" does not automatically mean "anonymous".
- **Status:** implemented.

---

## Craft decisions

### F1. Pins first

- **The app:** Step 3 lays out the pin board; step 6 transfers to the tail board.
- **Why:** This is how the textbook teaches it. The transfer lands on long grain, and fitting the tails makes up for saw errors on the pins [H 1]. European training mostly works this way [H 3]. Both orders are equally sound [H 1][H 2].

### F2. Slope 1:6 ≈ 9.46°

- **The app:** 1:6 via a helper triangle 1T over 6T, rounded to 9.5° in the text. A check question makes clear: the 10–14° from the book is a second rule of thumb, not the same value (10–14° corresponds to about 1:5.7 to 1:4).
- **Why:** 1:6 works for most projects [H 11]. The hardwood/softwood rule (1:6 or 1:8 ≈ 7.13°) is mostly convention [H 7][H 9][H 10].

### F3. Marking gauge set to the thickness

- **The app:** The marking gauge is set directly off the mating board (SL = D). The setting stays the same for the tail board.
- **Why:** This is the textbook default and remains so. Workshop practice differs: Myers gives 1/64″ (≈ 0.4 mm) over the stock thickness [H 5], Wittmer about 1/32″ (≈ 0.8 mm) [H 11]. The course can mention this variant as a note without changing the default.
- **Note:** The text recommends two light passes rather than one firm one. This matches Kenney if both passes run in the same track [H 17]. Wittmer warns against double lines [H 11].

### F4. Saw in the waste, without pressure

- **The app:** Saw on the waste side, leave the line, thumb only when starting, long strokes without pressure, slow down before the baseline.
- **Why:** Leaving the line is the key to tight joints [H 13][H 20]. Pressure and tension make the saw drift [H 20][H 21]. Thumb away from the teeth [H 23].

### F5. Chop from both sides

- **The app:** First chop at the baseline, bevel toward the waste, to half the thickness, flip, very slight undercut. The animation chops the outer half first, then the inner half.
- **Why:** Half from each side prevents blowout [H 12][H 15][H 18]. Whether to undercut is disputed [H 11][H 13]; for beginners, only a little [H 5].
- **Open:** Gochnour and Cosman start on the inside and finish on the outside, so any blowout stays inside [H 13][H 18]. The order in the animation needs checking.

### F6. Common mistakes and safety per step

- **The app:** Each step has its own common mistakes (mistake, cause, remedy) and its own safety notes.
- **Why:** The most frequent beginner mistakes are well documented (see [recherche.en.md, H8](recherche.en.md#h8-common-mistakes)). The tool rules follow the DGUV [H 23]. Matching one's own errors to a list is a proven exercise [H 13][H 15].

---

## Not yet implemented (ideas)

- **Worked-example stages in the calculator:** fully worked (today) → partly worked (the apprentice fills in AZT or T, the calculator checks) → on their own (the calculator only shows right or wrong) [D 5][D 6].
- **AR fading:** full lines → endpoints only → off, with a check after the cut. Switching depends on performance, not on time [D 10][D 11][D 12].
- **Trade-fair mode:** the learning log stays off, a "start over" button for every visitor, short sessions (see the IHM demo in [ihm-demo.md](ihm-demo.md), German).
- **Suggest a support level:** after correct answers and met checkpoints, the app suggests the next lower level [D 10].
- **Practice step on scrap:** straight line, stop at the line, leave the line, before step 4 [D 8][H 20].
- **Pauses in the demonstration:** the animation stops and asks "What comes next?" [D 3].

## Learning log

Off by default (opt-in). Learning events only, stored locally, without names or time of day, export only at the push of a button. For the study it is switched on only after consent (see the [study design](studiendesign.en.md), section 7).
