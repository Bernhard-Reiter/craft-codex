/**
 * Dovetail course (EN) — six steps for apprentices who have never cut a
 * dovetail. Through dovetail, pins first, 1:6 slope, geometric spacing on the
 * center line (Austrian carpentry textbook (Fachkunde Tischler), ch. 4.1 —
 * TODO(Bernhard): title/publisher). All text in our own words.
 *
 * Reasons for the teaching format: docs/zinken/lernpfad.md and
 * docs/zinken/recherche.md. German twin: lehrgang.ts (identical ids).
 */
import type { LehrgangSchritt } from "./lehrgang-typen";

export const LEHRGANG_EN: readonly LehrgangSchritt[] = [
  {
    id: "holz",
    nr: 1,
    titel: "Choose and prepare the wood",
    ziel: "You can spot the grain direction, the end grain and the reference faces, and you measure the board thickness D accurately.",
    werkzeug: ["Folding rule or steel rule", "Vernier caliper", "Try square", "Pencil"],
    vormachen: [
      "I take two boards of the same thickness, with no knots near the ends. For a first try I use softwood, for example spruce or pine, with calm, even grain.",
      "First I look for the best face and the straightest edge. These are my reference face and reference edge. I draw the face mark on them so I never mix them up.",
      "Then I use the try square to check that the end grain is cut square. If it isn't, I trim it clean first.",
      "Now I measure the thickness D with the caliper at both ends. I'll need this number soon for the layout and for the marking gauge.",
    ],
    nachmachen: [
      { kurz: "Choose boards", lang: "Choose two boards of the same thickness with no knots or cracks at the ends. The grain should run as parallel to the edge as possible." },
      { kurz: "Mark reference faces", lang: "On each board, pick a reference face and a reference edge and mark them with the face mark." },
      { kurz: "Check the end grain", lang: "Hold the try square against the reference face and the reference edge. The end grain must be square in both directions." },
      { kurz: "Measure D", lang: "Measure the thickness D at both ends. If the values differ, take the smaller one and tell your instructor." },
    ],
    kontrollpunkt: [
      "Both boards have the face mark on the reference face and the reference edge.",
      "The try square sits on both end-grain ends with no light showing through.",
      "You can give D to within 0.5 mm.",
    ],
    fehler: [
      { fehler: "Chip-out or crack at the end of the board", ursache: "Knot or drying crack close to the end grain", abhilfe: "Cut a few centimeters off the board or use another one. Dovetails only hold in sound wood." },
      { fehler: "The joint ends up out of square", ursache: "End grain not cut square", abhilfe: "Check with the try square before marking out, and trim if needed." },
      { fehler: "Faces mixed up", ursache: "Reference faces not marked", abhilfe: "Always put the face mark on first. Every measurement is taken from the reference face." },
    ],
    sicherheit: [
      "Lay the boards down firmly or clamp them while you measure and check.",
      "Splinters on rough edges: don't run your hands along the edge.",
    ],
    fragen: [
      {
        id: "holz-1",
        frage: "Why do you mark the reference face and reference edge?",
        antworten: [
          "So that all measurements are taken from the same side",
          "So the board looks nicer",
          "Because the glue only holds there",
        ],
        richtig: 0,
        erklaerung: "All layout lines start from the reference faces. That way the pins and tails fit together, even if the board isn't perfect.",
      },
      {
        id: "holz-2",
        frage: "What do you need the board thickness D for?",
        antworten: [
          "Only for ordering the wood",
          "For the layout and for setting the marking gauge",
          "For the amount of glue",
        ],
        richtig: 1,
        erklaerung: "D is part of the formula for the number of tails, and the baseline is marked with the marking gauge at exactly D.",
      },
    ],
    szene: { step: "ueberblick", anrissLayers: [] },
  },
  {
    id: "aufteilung",
    nr: 2,
    titel: "Layout on the center line",
    ziel: "You decide the number of tails and divide the board width so that pins are 1T wide, tails are 2T wide, and everything adds up exactly.",
    werkzeug: ["Calculator, or the calculator here", "Steel rule", "Pencil", "Marking gauge"],
    vormachen: [
      "I look at the board and estimate: how many tails will look good? For a board 140 mm wide and 20 mm thick, I'd guess about four.",
      "To check, I work it out: width divided by 1.7 times thickness gives 140 divided by 34, so just over 4. With 2 times the thickness it would be 3.5, so rather fewer tails. I decide: 4.",
      "Now the parts: three times the number of tails plus one, so 13 parts. Each part T is 140 divided by 13, about 10.8 mm.",
      "On the center line, each pin gets one part and each tail gets two parts. There is always a half pin on the outside. I check: 5 pins times 1T plus 4 tails times 2T makes 13T, so 140 mm again.",
      "For the 1:6 slope I draw a helper triangle: 1T to the side over 6T of length. That gives about 9.5 degrees. The 6T is only a helper length on paper, not a cutting length.",
    ],
    nachmachen: [
      { kurz: "Estimate", lang: "Estimate the number of tails by eye. To check, work out B/(1.7·D) for more tails or B/(2·D) for fewer." },
      { kurz: "Decide", lang: "Pick a whole number. The formula only gives a suggestion. You make the decision." },
      { kurz: "Work out the parts", lang: "AZT = 3·AZS + 1, then T = B/AZT (AZS = number of tails, AZT = number of parts). Write T down to one decimal place." },
      { kurz: "Check the sequence", lang: "Count it up: (AZS + 1) pins of 1T plus AZS tails of 2T must make exactly B." },
      { kurz: "Choose the slope", lang: "1:6 is the rule from the textbook (about 9.5°). Draw the helper triangle 1T over 6T and set the sliding bevel to it." },
    ],
    kontrollpunkt: [
      "All the parts add up to exactly the board width B.",
      "On the far left and the far right there is one half pin of 1T each.",
      "The sliding bevel is set to 1:6 and locked with its locking screw.",
    ],
    fehler: [
      { fehler: "The spacing doesn't work out, and a bit is left over at the edge", ursache: "T rounded too early and the rounded value used for measuring on", abhilfe: "Measure the spacing from both edges towards the middle, or step it off with dividers. Small leftovers then get spread out." },
      { fehler: "Tails look too narrow or too wide", ursache: "Number of tails only calculated, not looked at", abhilfe: "Decide the number, sketch the spacing roughly and check it by eye. Only then mark out." },
      { fehler: "Slope set wrong", ursache: "Helper triangle mixed up (6T to the side instead of 1T)", abhilfe: "The triangle is long and narrow: 6 parts along the grain, 1 part across it." },
    ],
    sicherheit: ["The sliding bevel and the marking gauge have points or blades: when you put them down, point them downwards or put the protective cap on."],
    fragen: [
      {
        id: "aufteilung-1",
        frage: "B = 140 mm, you've decided on 4 tails. How many parts (AZT)?",
        antworten: ["12", "13", "9"],
        richtig: 1,
        erklaerung: "AZT = 3 · 4 + 1 = 13. That's 5 pins of 1 part each and 4 tails of 2 parts each.",
      },
      {
        id: "aufteilung-2",
        frage: "How wide is a tail on the center line?",
        antworten: ["1T", "2T", "6T"],
        richtig: 1,
        erklaerung: "Pins are 1T wide, tails 2T. The 6T is the length of the helper triangle for the slope.",
      },
      {
        id: "aufteilung-3",
        frage: "What angle does a 1:6 slope give?",
        antworten: ["About 9.5°", "Exactly 14°", "About 30°"],
        richtig: 0,
        erklaerung: "1:6 means: 1 part to the side over 6 parts of length. That's about 9.5°. The textbook also mentions 10° to 14°. That's a second rule of thumb, not the same value.",
      },
    ],
    szene: { step: "anreissen", anrissLayers: ["divisions"] },
  },
  {
    id: "anreissen",
    nr: 3,
    titel: "Marking out — pin board first",
    ziel: "You mark out the baseline, spacing, slopes and waste on the pin board so that every cut has a clear line.",
    werkzeug: ["Marking gauge", "Marking knife", "Sliding bevel (set to 1:6)", "Try square", "Soft pencil"],
    vormachen: [
      "I set the marking gauge to exactly the thickness of the other board. It's best to set it straight off the board instead of reading a number.",
      "I mark the baseline all the way round: both faces and both edges, always with the fence against the end grain. I press lightly. Two light passes are better than one heavy one.",
      "On the end grain I mark out the spacing from the center line. From each spacing point I mark the slopes with the sliding bevel. On the pin board, the slopes go on the end grain.",
      "From the slopes I use the try square to take the lines straight down both faces to the baseline.",
      "Finally, I put a cross in every waste piece. From now on, for every cut I know which side of the line the saw runs on.",
    ],
    nachmachen: [
      { kurz: "Marking gauge to D", lang: "Set the marking gauge from the thickness of the other board, not from a number you read off." },
      { kurz: "Baseline all round", lang: "Mark the baseline on both faces and both edges. The fence always sits against the end grain." },
      { kurz: "Transfer the spacing", lang: "Mark the spacing points from step 2 on the end grain, starting from the center line." },
      { kurz: "Mark the slopes", lang: "Use the sliding bevel (1:6) to mark the slopes on the end grain from each point." },
      { kurz: "Square lines on the faces", lang: "Use the try square to take the lines from the slopes straight down to the baseline, on both faces." },
      { kurz: "Cross the waste", lang: "Mark every waste piece with a cross. Check it twice before you saw." },
    ],
    kontrollpunkt: [
      "The baseline runs all the way round, and its ends meet at the corners.",
      "Every slope points the right way: the pins get wider towards the inside face.",
      "Every waste piece has a cross, and no pin is crossed.",
    ],
    fehler: [
      { fehler: "Baseline runs crooked or is doubled", ursache: "Fence not tight against the end grain, or pressed too hard", abhilfe: "Press the fence on first, then draw the pin of the gauge along. Several light passes are better." },
      { fehler: "Waste marked on the wrong side", ursache: "Cross put on by feel", abhilfe: "Check out loud: pins stay, gaps go. Only then put the cross on." },
      { fehler: "Lines are fuzzy", ursache: "Hard or blunt pencil instead of a knife", abhilfe: "Mark the straight lines with the marking knife. The blade leaves a small edge that gives the saw something to hold onto." },
    ],
    sicherheit: [
      "The marking knife and the marking gauge are sharp: pull away from your body and keep your hand behind the edge.",
      "Clamp the board in the workbench for marking out. Don't hold it in your hand.",
    ],
    fragen: [
      {
        id: "anreissen-1",
        frage: "What do you set the marking gauge to?",
        antworten: ["The thickness of the other board", "Half the board width", "6T"],
        richtig: 0,
        erklaerung: "The pins are as long as the other board is thick. On a through dovetail, the baseline is exactly D from the end grain.",
      },
      {
        id: "anreissen-2",
        frage: "What is the cross in the waste piece for?",
        antworten: ["Decoration", "So you know which side of the line to saw on and what to chop out", "As a glue mark"],
        richtig: 1,
        erklaerung: "The saw always runs in the waste next to the line. Without a cross, it's easy to mix this up when you're under pressure.",
      },
    ],
    szene: { step: "anreissen", anrissLayers: ["baseline", "divisions", "flanks", "wastes"] },
  },
  {
    id: "saegen",
    nr: 4,
    titel: "Sawing — in the waste, upright, down to the baseline",
    ziel: "You saw every cut on the waste side of the line, upright and exactly down to the baseline.",
    werkzeug: ["Dovetail saw or Japanese dozuki", "Workbench with front vise", "Coping saw or scroll saw for the rough waste"],
    vormachen: [
      "I clamp the board upright and low in the vise, so nothing springs.",
      "I stand so that my forearm, the saw and the cut are in one line. I hold the saw loosely, like a bird: firm enough that it can't fly away, but without squeezing it.",
      "To start, I put my thumb against the blade, next to the line on the waste side. Then I make a few short, light strokes until the saw runs in its own groove.",
      "Now I saw with long, calm strokes and no pressure. I watch both lines at once: the slope on top and the upright line on the front.",
      "Just before the baseline I slow down and stop exactly on it. I never saw past it, because a cut past the baseline stays visible.",
    ],
    nachmachen: [
      { kurz: "Clamp", lang: "Clamp the board upright, just above the vise jaws, so it doesn't vibrate while you saw." },
      { kurz: "Waste side", lang: "Start the saw on the waste side next to the line, not on the line. The line stays." },
      { kurz: "Thumb guides", lang: "Put your thumb against the blade and make short starting strokes until there's a notch." },
      { kurz: "No pressure", lang: "Let the weight of the saw do the work and use long strokes. Pressure makes the saw wander." },
      { kurz: "Down to the baseline", lang: "Slow down before the baseline and stop exactly on it, the same on both faces." },
      { kurz: "Clear the rough waste", lang: "Remove the rough waste with the coping saw, staying 1–2 mm away from the baseline. The rest is chopped out with the chisel." },
    ],
    kontrollpunkt: [
      "Every cut is in the waste, and you can still see the layout line.",
      "The cut is upright. A try square against the face of the board shows no gap.",
      "On no face has the saw gone past the baseline.",
    ],
    fehler: [
      { fehler: "The saw wanders and the cut goes crooked", ursache: "Too much pressure, a tense grip, body not behind the saw", abhilfe: "Grip loosely, keep your forearm in line with the cut, saw without pressure. Practise on scrap wood first." },
      { fehler: "Sawn past the baseline", ursache: "Too fast at the end, or only watched one side", abhilfe: "Slow down at the end and check both faces. If one face has not reached the baseline yet, tilt the saw slightly and finish that face." },
      { fehler: "Gap in the finished joint", ursache: "Sawn on or past the line instead of in the waste", abhilfe: "The line must still be there after the cut. If you saw in the waste, you can fix it. If you saw on the wrong side, you can't." },
    ],
    sicherheit: [
      "Your free hand is never in front of the saw blade. Your thumb only guides at the start and then moves away.",
      "After the cut, put the saw down with the teeth pointing away from you.",
      "Don't saw while wearing an AR or VR headset. Look first, then take the headset off, then saw.",
    ],
    fragen: [
      {
        id: "saegen-1",
        frage: "Where do you start the saw?",
        antworten: ["Exactly on the line", "On the waste side next to the line", "On the pin side next to the line"],
        richtig: 1,
        erklaerung: "The line belongs to the pin. If you saw in the waste next to it, the pin fits. If you saw on the line, the pin ends up too narrow by half the width of the cut.",
      },
      {
        id: "saegen-2",
        frage: "What do you do to stop the saw wandering?",
        antworten: ["Push hard", "Guide it loosely and use long strokes with no pressure", "Saw faster"],
        richtig: 1,
        erklaerung: "Pressure and a tense grip are the most common causes of crooked cuts. The saw works with its own weight.",
      },
    ],
    szene: { step: "saegen", anrissLayers: ["baseline", "flanks", "wastes"], arbeitsgang: "saegen" },
  },
  {
    id: "stemmen",
    nr: 5,
    titel: "Chopping out — from both sides to the middle",
    ziel: "You chop the waste out cleanly down to the baseline, from both sides to the middle, with no tear-out.",
    werkzeug: ["Chisel (a little narrower than the gap)", "Mallet (wooden)", "Backing board made from scrap wood", "Clamp"],
    vormachen: [
      "I lay the board flat on a backing board and clamp it down. The backing board sits flush with the baseline.",
      "I pick a chisel that is a little narrower than the narrowest part of the gap.",
      "I put the chisel right in the baseline, with the bevel facing the waste. With a light tap I make the first cut. Then I take a small wedge out at an angle from the waste side, so I get a clean edge.",
      "Now I chop straight down and at an angle in turn, but only to about half the thickness. I tilt the chisel very slightly inwards so the middle ends up slightly hollow.",
      "Then I turn the board over and do the same from the other side, until the cuts meet in the middle. That way nothing tears out on either side.",
    ],
    nachmachen: [
      { kurz: "Clamp flat", lang: "Clamp the board flat on a backing board, with the backing board flush with the baseline." },
      { kurz: "Choose a chisel", lang: "Take a chisel that is a little narrower than the narrowest part of the gap." },
      { kurz: "First cut", lang: "Put the chisel in the baseline, bevel towards the waste, and tap lightly. Then take a wedge out from the waste side." },
      { kurz: "Halfway", lang: "Chop straight down and at an angle in turn, only to about half the thickness, slightly undercut." },
      { kurz: "Turn over", lang: "Turn the board over and chop from the other side until both sides meet." },
      { kurz: "Check", lang: "Check with the try square: the bottom of the gap is flat or slightly hollow, never domed." },
    ],
    kontrollpunkt: [
      "The baseline is crisp on both faces, with no tear-out.",
      "There is no ridge left in the gap. The middle is flat or very slightly hollow.",
      "The sides of the pins are undamaged. No chisel has crushed them.",
    ],
    fehler: [
      { fehler: "Tear-out on the back", ursache: "Chopped right through from one side only", abhilfe: "Only ever go halfway, then turn the board over. The backing board gives extra support." },
      { fehler: "The baseline creeps backwards", ursache: "First blow too hard, so the bevel pushes the chisel past the line", abhilfe: "Make the first cut lightly, then remove some waste first, and only then cut deeper." },
      { fehler: "Side of a pin damaged", ursache: "Chisel wider than the gap, or twisted", abhilfe: "Use a narrower chisel and hold it straight." },
      { fehler: "The joint won't close fully", ursache: "Bottom of the gap is domed, so it's too high in the middle", abhilfe: "Undercut slightly so the middle doesn't touch. Check with the try square." },
    ],
    sicherheit: [
      "Both hands behind the cutting edge. Your guiding hand holds the chisel by the handle or by the blade above the board, never in front of the edge.",
      "Always clamp the board down. Never hold it with your hand.",
      "Only use sharp chisels. Blunt ones need more force and are more likely to slip.",
      "Don't chop out while wearing an AR or VR headset.",
    ],
    fragen: [
      {
        id: "stemmen-1",
        frage: "Why do you chop from both sides?",
        antworten: ["So it's quicker", "So nothing tears out on the back", "Because the chisel is too short"],
        richtig: 1,
        erklaerung: "If you chop right through from one side, you push fibres out on the back. Working from both sides to the middle keeps both baselines crisp.",
      },
      {
        id: "stemmen-2",
        frage: "Which way does the bevel face when you make the first cut on the baseline?",
        antworten: ["Towards the waste side", "Towards the pin", "It doesn't matter"],
        richtig: 0,
        erklaerung: "The flat back of the chisel sits on the baseline, and the bevel points into the waste. That keeps the cut exactly on the line.",
      },
    ],
    szene: { step: "stemmen", anrissLayers: ["baseline", "wastes"], arbeitsgang: "stemmen" },
  },
  {
    id: "passen",
    nr: 6,
    titel: "Transferring, fitting, gluing up",
    ziel: "You transfer the pins exactly onto the tail board, dry-fit the joint and glue it up with no gaps.",
    werkzeug: ["Marking knife", "Marking gauge (same setting)", "Dovetail saw", "Chisel", "Mallet", "Glue", "Clamps", "Cauls"],
    vormachen: [
      "The tail board gets the same baseline. For this I use the marking gauge with the same setting as before.",
      "I stand the finished pin board exactly on the baseline of the tail board, reference face to reference face. Then I run the knife along the side of each pin. The board must not slip while I do this.",
      "With the try square I carry the lines across the end grain and cross out the waste. This time the gaps for the pins are the waste.",
      "Again I saw in the waste and chop out from both sides. Then I push the parts together just a little, without glue. Where it's tight, you can see shiny pressure marks. Only there do I shave off a whisper-thin amount with the chisel.",
      "Only when it goes together by hand, with light taps on a caul, does glue go on the sides. Then I clamp it up with cauls and clamps and check it's square.",
    ],
    nachmachen: [
      { kurz: "Baseline on the tail board", lang: "Mark the baseline all the way round without changing the marking gauge setting." },
      { kurz: "Transfer", lang: "Stand the pin board exactly on the baseline, reference faces together, and run the knife along the sides of the pins." },
      { kurz: "Lines and waste", lang: "Carry the lines across the end grain with the try square and cross out the waste. This time it's the gaps for the pins." },
      { kurz: "Saw and chop out", lang: "Saw in the waste and chop out from both sides, just like on the pin board." },
      { kurz: "Dry-fit", lang: "Push the parts together just a little, read the pressure marks and only take a bit off there." },
      { kurz: "Glue up", lang: "Put glue on the sides, tap the joint together using cauls, clamp it, check it's square and remove the glue squeeze-out." },
    ],
    kontrollpunkt: [
      "The joint goes together dry with light taps on a caul, without anything splitting.",
      "There's no gap at the sides. A sheet of paper won't fit in.",
      "The boards are square to each other. The try square sits flat against them.",
    ],
    fehler: [
      { fehler: "Joint twisted or offset", ursache: "Reference faces swapped when transferring, or the board slipped", abhilfe: "Reference face to reference face. Hold the pin board in place with a clamp or a weight, then transfer." },
      { fehler: "Too tight, and the board splits when you knock it together", ursache: "Sawn on the line instead of in the waste, or the line left on the wrong side", abhilfe: "Dry-fit, read the pressure marks and take off a whisper-thin amount with the chisel. Never force it." },
      { fehler: "Gap at the sides", ursache: "Sawn into the pin, or too much taken off when fitting", abhilfe: "Next time, leave the line. Only fill small gaps after talking to your instructor." },
      { fehler: "The joint won't close fully", ursache: "Domed bottom or a ridge in the corner", abhilfe: "Pare the bottom slightly hollow and clean out the corners with a narrow chisel." },
    ],
    sicherheit: [
      "Always use a caul when you knock the joint together. Never hit the workpiece directly.",
      "Keep glue out of your eyes. Wash your hands after gluing up.",
    ],
    fragen: [
      {
        id: "passen-1",
        frage: "How do you transfer the pins onto the tail board?",
        antworten: ["By measuring again", "Stand the pin board on the baseline and run the knife along the sides of the pins", "By eye"],
        richtig: 1,
        erklaerung: "When you transfer, you don't measure again. The finished pin board is the template, so the joint fits even if the pins aren't perfect.",
      },
      {
        id: "passen-2",
        frage: "It's tight when you dry-fit. What do you do?",
        antworten: ["Hit it harder", "Look for pressure marks and take a whisper-thin amount off only there", "Glue it up straight away"],
        richtig: 1,
        erklaerung: "Shiny spots show where it's pressing. Take off a little, right there. Force will split the board.",
      },
    ],
    szene: { step: "passen", anrissLayers: [], arbeitsgang: "passen" },
  },
] as const;
