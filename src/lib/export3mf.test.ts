import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { exportMeshTo3mf } from "./export3mf";
import { generateLithophaneMesh } from "./generateLithophaneMesh";

describe("exportMeshTo3mf", () => {
  it("writes a valid 3MF package shape", () => {
    const mesh = generateLithophaneMesh(
      {
        width: 2,
        height: 2,
        values: new Float32Array([0, 1, 1, 0]),
      },
      {
        physicalWidthMm: 20,
        physicalHeightMm: 20,
        minThicknessMm: 1,
        maxThicknessMm: 3,
      }
    );

    const archive = exportMeshTo3mf(mesh, {
      modelName: "test",
      application: "vitest",
      precision: 3,
      compress: true,
    });

    const files = unzipSync(archive);
    expect(files["[Content_Types].xml"]).toBeDefined();
    expect(files["_rels/.rels"]).toBeDefined();
    expect(files["3D/3dmodel.model"]).toBeDefined();

    const model = strFromU8(files["3D/3dmodel.model"]);
    expect(model).toContain('<model unit="millimeter"');
    expect(model.match(/<vertex /g)).toHaveLength(8);
    expect(model.match(/<triangle /g)).toHaveLength(12);
  });
});
