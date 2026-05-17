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
