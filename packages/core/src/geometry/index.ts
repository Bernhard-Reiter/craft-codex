export * from "./types.js";
export {
  computePins,
  generateMarkings,
  validateDovetailParams,
} from "./dovetail.js";
export type { PinShape } from "./dovetail.js";
export {
  generateBoardAMesh,
  generateBoardBMesh,
  markingsToLineSegments,
} from "./three-helpers.js";
export {
  computeDovetailLayout,
  method1Mittellinie,
  method2Randverstaerkung,
  method3Grundlinie,
  nearestOdd,
} from "./construction.js";
export type {
  DovetailLayout,
  DovetailMethod,
  ConstructionOptions,
} from "./construction.js";
export { buildDovetailAnriss } from "./anriss.js";
export type {
  DovetailAnriss,
  AnrissPoint,
  AnrissLine,
  AnrissLineRole,
  AnrissArea,
  AnrissDimension,
  MaterialState,
} from "./anriss.js";
