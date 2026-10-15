# Study Design: Proof of Learning for the Dovetail Course (Draft for the Bachelor's Thesis)

> As of October 14, 2026, draft from the night sprint. Must be agreed with the supervisor, the ethics office, and the university's data protection office before any data is collected.
> Sources: `[D n]` = didactics part, `[H n]` = craft part in [recherche.en.md](recherche.en.md).
> German: [studiendesign.md](studiendesign.md).

## 1. Research question

**Main question:** After the digital course (computer, AR, VR), do apprentices with no dovetail experience make a better through dovetail than after conventional instruction of the same length (textbook and trainer following the four-step method)? The test is done without digital help and with new dimensions.

The phrase "without digital help" matters. What is measured is what was learned, not performance with overlaid lines. Constant overlaid help can improve practice performance and worsen retention (guidance hypothesis) [D 10][D 11][D 12].

**Secondary questions**
- N1: Do the groups differ in the individual sub-skills (spacing, laying out, sawing, chopping)?
- N2: How do the apprentices rate usability (SUS) and workload (NASA-TLX)? How does their self-efficacy change?
- N3: How accurately do the AR layout lines sit on the real board (residual registration error, deviation at control marks)?

## 2. Hypotheses

- **H1 (primary):** In the post-test, the prototype group has smaller joint gaps than the control group (mean across defined measuring points).
- **H2:** The prototype reduces the deviation of the slope from the target (1:6 ≈ 9.46°) and the deviation of the layout lines from the spacing.
- **H3:** In the post-test, the prototype group shows fewer error types from the list of common mistakes (sawn past the baseline, blowout, transferred the wrong way round …).
- **H4 (exploratory):** In the delayed test (7–14 days), an advantage remains.
- **Counter-hypothesis, explicitly tested:** The AR help improves practice performance but not the post-test without help (dependence on the help) [D 10].

## 3. Design

- **Type:** Pilot study with two groups, pre/post and, if possible, a delayed test. Assignment is random, stratified by year of apprenticeship and prior experience. In addition, there is a pre-test on scrap: sawing straight along a line.
- **Control group (C):** Textbook section and trainer instruction following the four-step method [D 1][D 2]. Same time, same wood, same tools.
- **Prototype group (P):** Computer course (learning steps 1–6, check questions, calculator) → VR demonstration in slow motion → AR layout on the real board → sawing and chopping **without the headset** (safety rule). The trainer is present and steps in only on safety matters.
- **Held constant:** Instruction time, practice time, wood species (e.g., spruce, same batch), board dimensions for practice (W 140 / T 20), and safety briefing.
- **Post-test (both groups, without digital help):** a new width and thickness (e.g., W 120 / T 18), so that the method is tested, not memorized dimensions. Set a time limit.
- **Delayed test:** after 7–14 days, same task, if the company or school allows it.

## 4. Measures

### Objective (on the workpiece, raters blind to group)

Every workpiece gets a code. The people measuring do not know which group a piece comes from.

| Measure | Procedure (set in advance) | Unit |
|---|---|---|
| Joint gap (primary) | Feeler gauge at defined measuring points per flank after a standardized dry fit, without pressing | mm |
| Slope deviation | Flank angle with protractor or photo + analysis, against the target 9.46° | ° |
| Layout deviation | Distance of the layout lines from the target spacing (caliper) before sawing | mm |
| Baseline | Overcut past the baseline yes/no, length | mm |
| Error types | Count using the course's list of common mistakes (per learning step) | count |
| Time | per sub-step and in total | min |
| Overall rating | Blind rating by two experts using a criteria list, agreement (ICC/kappa) | scale |

The research found no standardized measure of dovetail quality. The own protocol is therefore part of the thesis and will be tried out in the pilot first [D 24][D 25].

### Subjective (questionnaire)

- **SUS** (System Usability Scale), P only [D 31][D 32]
- **NASA-TLX** (workload), both groups after practice [D 33]
- **Self-efficacy:** a task-specific scale following Bandura's guide ("I can lay out a dovetail so that …") [D 35], plus the general scale by Schwarzer & Jerusalem [D 34]
- **SSQ** (simulator sickness) before and after every headset session, with a stop criterion [D 30][D 29]

### Technical (P only)

- Residual error of the 3-point registration as shown by the prototype
- Deviation of a projected control mark from a real mark. No published millimeter-level measurement of the overlay exists for Quest 3; this measurement is a contribution of its own [D 26][D 27].

## 5. Sample

- Target group: first-year cabinetmaker apprentices with no dovetail experience (self-report and trainer confirmation).
- **Pilot:** 12–20 people in total. That is enough for feasibility and variance, not for a firm proof of effectiveness. The size of a main study is planned from the pilot variance and a practically relevant minimum difference, e.g., 0.2 mm joint gap. Experts set this value.
- Exclusion: people with prior experience or with health reasons against VR/AR (epilepsy, severe motion sickness). Not wanting to use the headset is not a reason for exclusion; it is documented.

## 6. Analysis

- Primary: comparison of the joint gap in the post-test between P and C with the pre-test as covariate (ANCOVA). With a small sample or violated assumptions, Mann-Whitney U or rank-based analysis of variance. Report effect size with confidence interval, not only the p-value.
- Secondary: angle, layout lines, error types (count model), time; questionnaires descriptively and as group comparison.
- Agreement of the two raters: ICC or weighted kappa.
- Set in advance (preregistration, e.g., OSF): hypotheses, measuring points, analysis, handling of missing values.

## 7. Ethics and data protection (apprentices are often minors)

- **Consent:** Required are the consent of the parents or guardians and the assent of the apprentice, with separate, age-appropriate information sheets [D 38]. In addition, the training company or vocational school must agree. For schools, the education authority's rules for empirical research apply [D 39]. An ethics approval from the university must be obtained.
- **Legal basis:** Art. 8 GDPR and § 4(4) DSG (age 14) concern online services offered directly to children. They are **not** the legal basis of this study and are not cited as such [D 36][D 37].
- **Data:** Workpiece codes instead of names (pseudonymization). The key list is kept separately by the study lead and deleted after the analysis. No passthrough or camera images are stored. Photos show only workpieces, no people.
- **Prototype:** The learning log is off by default. It works only with opt-in, stores locally without name or time of day, only learning step, question right/wrong, support level, and rough minutes. Export only as a file at the push of a button. For the study it is switched on only after consent. "Local" does not automatically mean "anonymous"; timelines combined with the class schedule can point to individuals.
- **Safety:** Never saw or chop with the headset on. Headset sessions stay short (guideline under 20 minutes, to be checked in the pilot), with SSQ and the option to stop at any time [D 29][D 30]. Tool rules follow DGUV Information 209-001 [H, see recherche.en.md].

## 8. Limitations

- Small pilot sample, one wood species, one company or school. Results generalize only to a limited extent.
- Novelty effect of the headset, and the trainer's influence can only partly be held constant.
- No haptics in VR: the feel of sawing and chopping only develops on real wood.
- The headset's tracking accuracy is not measurement technology. The AR lines are an aid, not a measure; layout is done with marking gauge and marking knife.
- The control group's performance depends heavily on the trainer. This is documented and, if possible, balanced by using several trainers.

## 9. Open points for Bernhard

- University, supervisor, and ethics office
- Partner company or vocational school for the pilot
- Experts for the blind rating (two people)
- Title and publisher of the textbook (TODO(Bernhard): title/publisher)
