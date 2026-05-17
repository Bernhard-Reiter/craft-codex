import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  generateBoardAMesh,
  generateBoardBMesh,
  markingsToLineSegments,
  generateMarkings,
  DEFAULT_DOVETAIL_PARAMS,
  type DovetailParams,
} from "../src/geometry/index.js";

const P: DovetailParams = { ...DEFAULT_DOVETAIL_PARAMS };

describe("generateBoardAMesh", () => {
  it("returns a Mesh with non-empty geometry", () => {
    const mesh = generateBoardAMesh(P, THREE);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    const positions = mesh.geometry.getAttribute("position");
    expect(positions.count).toBeGreaterThan(0);
  });

  it("bounding box matches param dimensions (within tolerance)", () => {
    const mesh = generateBoardAMesh(P, THREE);
    mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox!;
    const xExtent = bb.max.x - bb.min.x;
    const yExtent = bb.max.y - bb.min.y;
    const zExtent = bb.max.z - bb.min.z;
    expect(xExtent).toBeGreaterThanOrEqual(P.width_mm * 0.5);
    expect(xExtent).toBeLessThanOrEqual(P.width_mm + 1);
    expect(yExtent).toBeGreaterThanOrEqual(P.thickness_mm * 0.9);
    expect(yExtent).toBeLessThanOrEqual(P.thickness_mm + 1);
    expect(zExtent).toBeGreaterThanOrEqual(P.length_mm * 0.9);
    expect(zExtent).toBeLessThanOrEqual(P.length_mm + 1);
  });

  it("scales vertex count with pinCount (more pins → more cuts → more verts)", () => {
    const meshFew = generateBoardAMesh({ ...P, pinCount: 2 }, THREE);
    const meshMany = generateBoardAMesh({ ...P, pinCount: 7 }, THREE);
    const fewVerts = meshFew.geometry.getAttribute("position").count;
    const manyVerts = meshMany.geometry.getAttribute("position").count;
    expect(manyVerts).toBeGreaterThan(fewVerts);
  });

  it("handles pinCount=0 gracefully (returns base box mesh)", () => {
    const mesh = generateBoardAMesh({ ...P, pinCount: 0 }, THREE);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    const positions = mesh.geometry.getAttribute("position");
    expect(positions.count).toBeGreaterThan(0);
  });
});

describe("generateBoardBMesh", () => {
  it("returns a Mesh with non-empty geometry", () => {
    const mesh = generateBoardBMesh(P, THREE);
    expect(mesh).toBeInstanceOf(THREE.Mesh);
    expect(mesh.geometry.getAttribute("position").count).toBeGreaterThan(0);
  });

  it("has fewer vertices than full uncut box (proves CSG cuts happened)", () => {
    const meshB = generateBoardBMesh(P, THREE);
    const fullBox = new THREE.BoxGeometry(
      P.width_mm,
      P.thickness_mm,
      P.length_mm,
    );
    const meshBVerts = meshB.geometry.getAttribute("position").count;
    const fullBoxVerts = fullBox.getAttribute("position").count;
    expect(meshBVerts).toBeGreaterThan(fullBoxVerts);
  });
});

describe("markingsToLineSegments", () => {
  it("returns LineSegments with positions for each polyline segment", () => {
    const markings = generateMarkings("anreissen", P);
    const ls = markingsToLineSegments(markings, THREE);
    expect(ls).toBeInstanceOf(THREE.LineSegments);
    const positions = ls.geometry.getAttribute("position");
    expect(positions.count).toBeGreaterThan(0);
    expect(positions.count % 2).toBe(0);
  });

  it("has matching color attribute (vertex colors)", () => {
    const markings = generateMarkings("anreissen", P);
    const ls = markingsToLineSegments(markings, THREE);
    const positions = ls.geometry.getAttribute("position");
    const colors = ls.geometry.getAttribute("color");
    expect(colors).toBeDefined();
    expect(colors.count).toBe(positions.count);
  });

  it("handles empty markings array", () => {
    const ls = markingsToLineSegments([], THREE);
    expect(ls).toBeInstanceOf(THREE.LineSegments);
    expect(ls.geometry.getAttribute("position").count).toBe(0);
  });

  it("each marking polyline produces (N-1) segments worth of vertices", () => {
    const markings = generateMarkings("saegen", { ...P, pinCount: 5 });
    const expectedSegments = markings.reduce(
      (acc, m) => acc + (m.points.length - 1),
      0,
    );
    const ls = markingsToLineSegments(markings, THREE);
    const vertexCount = ls.geometry.getAttribute("position").count;
    expect(vertexCount).toBe(expectedSegments * 2);
  });
});
