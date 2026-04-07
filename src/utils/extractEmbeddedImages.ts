/* global JSZip */
declare const JSZip: any;

export interface EmbeddedImage {
  blob: Blob;
  previewUrl: string;
  filename: string;
  mimeType: string;
  ext: string;
}

export interface ExtractionResult {
  hasImages: boolean;
  rowImageMap: Record<number, EmbeddedImage>;
  imageCount: number;
}

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  tiff: "image/tiff",
  tif: "image/tiff",
  bmp: "image/bmp",
};

export default async function extractEmbeddedImages(file: File): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(file);
  const mediaFiles: Record<string, EmbeddedImage> = {};
  const rowImageMap: Record<number, EmbeddedImage> = {};

  for (const [path, entry] of Object.entries(zip.files) as [string, any][]) {
    if (path.startsWith("xl/media/")) {
      const filename = path.split("/").pop()!;
      const blob = await entry.async("blob");
      const ext = filename.split(".").pop()!.toLowerCase();
      const typedBlob = new Blob([blob], { type: MIME_MAP[ext] || "image/png" });
      mediaFiles[filename] = {
        blob: typedBlob,
        previewUrl: URL.createObjectURL(typedBlob),
        filename,
        mimeType: MIME_MAP[ext] || "image/png",
        ext: ext === "jpeg" ? "jpg" : ext,
      };
    }
  }

  if (Object.keys(mediaFiles).length === 0) {
    return { hasImages: false, rowImageMap: {}, imageCount: 0 };
  }

  const drawingPaths = Object.keys(zip.files).filter((f) =>
    /xl\/drawings\/drawing\d+\.xml$/.test(f)
  );

  for (const drawingPath of drawingPaths) {
    const relsPath = drawingPath.replace("xl/drawings/", "xl/drawings/_rels/") + ".rels";
    const rIdToFile: Record<string, string> = {};

    if (zip.files[relsPath]) {
      const relsXml = await zip.files[relsPath].async("string");
      const relsDoc = new DOMParser().parseFromString(relsXml, "text/xml");
      for (const rel of relsDoc.querySelectorAll("Relationship")) {
        rIdToFile[rel.getAttribute("Id")!] = rel.getAttribute("Target")!.split("/").pop()!;
      }
    }

    const drawingXml = await zip.files[drawingPath].async("string");
    const doc = new DOMParser().parseFromString(drawingXml, "text/xml");
    const anchors = [
      ...Array.from(doc.querySelectorAll("twoCellAnchor")),
      ...Array.from(doc.querySelectorAll("oneCellAnchor")),
    ];

    for (const anchor of anchors) {
      const fromRow = anchor.querySelector("from row");
      if (!fromRow) continue;
      const rowIndex = parseInt(fromRow.textContent!, 10);

      const blip = anchor.querySelector("blip");
      if (!blip) continue;

      let rId: string | null = null;
      for (const attr of blip.attributes) {
        if (attr.localName === "embed") {
          rId = attr.value;
          break;
        }
      }
      if (!rId) continue;

      const imgFile = rIdToFile[rId];
      if (imgFile && mediaFiles[imgFile] && !rowImageMap[rowIndex]) {
        rowImageMap[rowIndex] = mediaFiles[imgFile];
      }
    }
  }

  return {
    hasImages: Object.keys(rowImageMap).length > 0,
    rowImageMap,
    imageCount: Object.keys(rowImageMap).length,
  };
}

export function revokeImageUrls(rowImageMap: Record<number, EmbeddedImage>) {
  for (const img of Object.values(rowImageMap)) {
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
  }
}
