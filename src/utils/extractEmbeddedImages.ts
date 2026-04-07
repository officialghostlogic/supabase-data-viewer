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

async function loadMediaFiles(zip: any): Promise<Record<string, EmbeddedImage>> {
  const mediaFiles: Record<string, EmbeddedImage> = {};
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
  return mediaFiles;
}

/** Traditional drawing-based images (twoCellAnchor / oneCellAnchor) */
async function extractDrawingImages(
  zip: any,
  mediaFiles: Record<string, EmbeddedImage>
): Promise<Record<number, EmbeddedImage>> {
  const rowImageMap: Record<number, EmbeddedImage> = {};
  const drawingPaths = Object.keys(zip.files).filter((f: string) =>
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

  return rowImageMap;
}

/** Modern rich-data images (Excel 365+, stored in xl/richData/) */
async function extractRichDataImages(
  zip: any,
  mediaFiles: Record<string, EmbeddedImage>
): Promise<Record<number, EmbeddedImage>> {
  const rowImageMap: Record<number, EmbeddedImage> = {};

  // 1. Parse richValueRel.xml rels to get ordered image filenames
  const relsPath = "xl/richData/_rels/richValueRel.xml.rels";
  if (!zip.files[relsPath]) return rowImageMap;

  const relsXml = await zip.files[relsPath].async("string");
  const relsDoc = new DOMParser().parseFromString(relsXml, "text/xml");
  const rIdToFile: Record<string, string> = {};
  for (const rel of relsDoc.querySelectorAll("Relationship")) {
    rIdToFile[rel.getAttribute("Id")!] = rel.getAttribute("Target")!.split("/").pop()!;
  }

  // 2. Parse richValueRel.xml to get ordered rId list
  const rvRelPath = "xl/richData/richValueRel.xml";
  if (!zip.files[rvRelPath]) return rowImageMap;
  const rvRelXml = await zip.files[rvRelPath].async("string");
  const rvRelDoc = new DOMParser().parseFromString(rvRelXml, "text/xml");
  const orderedImageFiles: string[] = [];
  for (const rel of rvRelDoc.querySelectorAll("rel")) {
    let rId: string | null = null;
    for (const attr of rel.attributes) {
      if (attr.localName === "id") { rId = attr.value; break; }
    }
    if (rId && rIdToFile[rId]) {
      orderedImageFiles.push(rIdToFile[rId]);
    } else {
      orderedImageFiles.push("");
    }
  }

  // 3. Parse rdrichvalue.xml to map rv index → image index
  const rvPath = "xl/richData/rdrichvalue.xml";
  if (!zip.files[rvPath]) return rowImageMap;
  const rvXml = await zip.files[rvPath].async("string");
  const rvDoc = new DOMParser().parseFromString(rvXml, "text/xml");
  const rvToImageIdx: number[] = [];
  for (const rv of rvDoc.querySelectorAll("rv")) {
    const vals = rv.querySelectorAll("v");
    // First <v> is the image index into richValueRel
    rvToImageIdx.push(vals.length > 0 ? parseInt(vals[0].textContent!, 10) : -1);
  }

  // 4. Parse sheet XML to find cells with vm attribute (value metadata)
  const sheetPaths = Object.keys(zip.files).filter((f: string) =>
    /xl\/worksheets\/sheet\d+\.xml$/.test(f)
  );

  for (const sheetPath of sheetPaths) {
    const sheetXml = await zip.files[sheetPath].async("string");
    const sheetDoc = new DOMParser().parseFromString(sheetXml, "text/xml");

    for (const row of sheetDoc.querySelectorAll("row")) {
      const rowNum = parseInt(row.getAttribute("r")!, 10); // 1-based
      const rowIndex = rowNum - 1; // convert to 0-based

      for (const cell of row.querySelectorAll("c")) {
        const vm = cell.getAttribute("vm");
        if (!vm) continue;

        // vm is 1-based index into valueMetadata
        const vmIdx = parseInt(vm, 10) - 1;
        if (vmIdx < 0 || vmIdx >= rvToImageIdx.length) continue;

        const imgIdx = rvToImageIdx[vmIdx];
        if (imgIdx < 0 || imgIdx >= orderedImageFiles.length) continue;

        const imgFile = orderedImageFiles[imgIdx];
        if (imgFile && mediaFiles[imgFile] && !rowImageMap[rowIndex]) {
          rowImageMap[rowIndex] = mediaFiles[imgFile];
        }
      }
    }
  }

  return rowImageMap;
}

export default async function extractEmbeddedImages(file: File): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(file);
  const mediaFiles = await loadMediaFiles(zip);

  if (Object.keys(mediaFiles).length === 0) {
    return { hasImages: false, rowImageMap: {}, imageCount: 0 };
  }

  // Try both extraction methods
  const drawingMap = await extractDrawingImages(zip, mediaFiles);
  const richDataMap = await extractRichDataImages(zip, mediaFiles);

  // Merge: drawing takes precedence, then rich data fills gaps
  const rowImageMap: Record<number, EmbeddedImage> = { ...richDataMap, ...drawingMap };

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
