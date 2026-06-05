import { strToU8, zipSync } from "fflate";
import type { MeshData } from "./generateLithophaneMesh";

export type Export3mfOptions = {
  modelName: string;
  application: string;
  precision: number;
  compress: boolean;
};

export function exportMeshTo3mf(
  mesh: MeshData,
  options: Export3mfOptions
): Uint8Array {
  const modelXml = buildModelXml(mesh, options);
  const level = options.compress ? 6 : 0;

  return zipSync(
    {
      "[Content_Types].xml": strToU8(contentTypesXml),
      "_rels/.rels": strToU8(relationshipsXml),
      "3D/3dmodel.model": strToU8(modelXml),
    },
    { level }
  );
}

function buildModelXml(mesh: MeshData, options: Export3mfOptions): string {
  const precision = Math.max(0, Math.min(8, Math.round(options.precision)));
  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="zh-CN" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">',
    `<metadata name="Title">${escapeXml(options.modelName)}</metadata>`,
    `<metadata name="Application">${escapeXml(options.application)}</metadata>`,
    '<resources><object id="1" type="model"><mesh><vertices>',
  ];

  for (let i = 0; i < mesh.positions.length; i += 3) {
    parts.push(
      `<vertex x="${formatNumber(mesh.positions[i], precision)}" y="${formatNumber(
        mesh.positions[i + 1],
        precision
      )}" z="${formatNumber(mesh.positions[i + 2], precision)}"/>`
    );
  }

  parts.push("</vertices><triangles>");

  for (let i = 0; i < mesh.indices.length; i += 3) {
    parts.push(
      `<triangle v1="${mesh.indices[i]}" v2="${mesh.indices[i + 1]}" v3="${
        mesh.indices[i + 2]
      }"/>`
    );
  }

  parts.push(
    "</triangles></mesh></object></resources><build><item objectid=\"1\"/></build></model>"
  );

  return parts.join("");
}

function formatNumber(value: number, precision: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number(value.toFixed(precision)).toString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const contentTypesXml =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>' +
  "</Types>";

const relationshipsXml =
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>' +
  "</Relationships>";
