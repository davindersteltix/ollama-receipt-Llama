import { fromBuffer } from "pdf2pic";
import { PDFDocument } from "pdf-lib";

/**
 * Converts each page of a PDF into a Base64-encoded image using pdf2pic.
 * @param {Buffer} pdfBuffer - The buffer of the PDF file.
 * @returns {Promise<string[]>} - A promise that resolves to an array of Base64-encoded images.
 */
export async function getPDFPagesAsImages(pdfBuffer) {
  try {
    // Use pdf-lib to get the total number of pages
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    console.log("Total pages in PDF:", totalPages);
    const pdf2pic = fromBuffer(pdfBuffer, {
      format: "png", // Output format
      density: 600, // DPI
      preserveAspectRatio: true, // Preserve aspect ratio
      quality: 100, // Quality of the image
      savePath: "./", // Save path for images
    });

    const pagesAsImages = [];

    // Loop through each page and convert it to an image
    for (let page = 1; page <= totalPages; page++) {
      const pageImage = await pdf2pic(page, { responseType: "base64" });
      pagesAsImages.push(pageImage.base64); // Add Base64-encoded image
    }

    return pagesAsImages;
  } catch (error) {
    console.error("Error converting PDF pages to images:", error);
    throw error;
  }
}
