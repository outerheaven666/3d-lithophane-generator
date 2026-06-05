import { describe, expect, it } from "vitest";
import { generateLithophaneMesh } from "./generateLithophaneMesh";

describe("generateLithophaneMesh", () => {
  it("creates a closed mesh with front, back, and side faces", () => {
    const mesh = generateLithophaneMesh(
      {
        width: 2,
        height: 2,
        values: new Float32Array([0, 0.5, 1, 0.25]),
      },
      {
        physicalWidthMm: 20,
        physicalHeightMm: 10,
        minThicknessMm: 1,
        maxThicknessMm: 3,
      }
    );

    expect(mesh.vertexCount).toBe(8);
    expect(mesh.triangleCount).toBe(12);
    expect(mesh.indices.length).toBe(36);
    expect(mesh.indexType).toBe("uint16");
    expect(Array.from(mesh.positions.slice(0, 12))).toEqual([
      -10, 5, 1, 10, 5, 2, -10, -5, 3, 10, -5, 1.5,
    ]);
  });
});
