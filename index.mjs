import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import multer from "multer";
import express from "express";
import { Ollama } from "ollama";
import { getPDFPagesAsImages } from "./pdfHandler.mjs";
import { MODELS } from "./Models.mjs";

const ollama = new Ollama({
  host: "http://10.120.0.4:7869/",
});

const app = express();
const port = 3005;

const storage = multer({ storage: multer.memoryStorage() });
const ItemSchema = z.object({
  description: z.string().describe("Item description."),
  itemNumber: z
    .string()
    .describe(
      "Item number or Item. can have letters, numbers and -. for example LAT0279-0030-22. Must have -"
    ),
  item: z
    .string()
    .describe(
      "Item number or Item. can have letters, numbers and -. for example LAT0279-0030-22. Must have -"
    ),
  unitOfMeasure: z.string().describe("Unit of measure"),
  unitPrice: z.string().describe("Unit price of the item"),
  totalPrice: z.string().describe("Total price of the item"),
  SupplierPart: z.string().describe("Supplier part number"),
  quantity: z.number().describe("Quantity of the item"),
  confidence: z.number(),
});

const ImageDescriptionSchema = z.object({
  items: z.array(ItemSchema).describe("Ordered items."),
  dateOfOrder: z.string().describe("The date of the order"),
  totalPrice: z.number().describe("Total price of the order"),
  shipTo: z.string().describe("(Ship to) address "),
  billTo: z.string().describe("(Bill to) address"),
  shipVia: z.string().describe("Shipping method"),
  shippingInstructions: z.string().describe("Shipping instructions"),
  confidence: z.number().describe("confidence of the model"),
  purchaseOrderNumber: z.string().describe("Purchase order number"),
});

async function analyzeImage(messages) {
  try {
    // Convert the Zod schema to JSON Schema format
    const jsonSchema = zodToJsonSchema(ImageDescriptionSchema);
    // const model = "gemma3:27b";
    const model = "granite3.2-vision:latest";
    const models = (await ollama.list()).models;

    // check if ollama has the llama3.2-vision:11b model
    const isModelAvailable = models.some((line) => line.model === model);
    if (!isModelAvailable) {
      throw new Error(`Model ${model} not found.`);
    }

    const response = await ollama.chat({
      model: MODELS.gemma,
      messages: messages,
      format: jsonSchema,
      options: {
        temperature: 0, // Make responses more deterministic
      },
    });
    console.log("Response from Ollama:", response.message.content);
    return JSON.parse(response.message.content);
    // Parse and validate the response
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error.message;
  }
}

app.post("/", storage.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).send("No file uploaded");
    }
    console.log("File uploaded:", req.file.originalname);
    const base64Image = req.file.buffer.toString("base64");
    let imageAnalysis = {};
    // if file pdf
    if (req.file.mimetype === "application/pdf") {
      // const pdfBuffer = req.file.buffer;
      const pages = await getPDFPagesAsImages(req.file.buffer);
      console.log({ pages });
      const messages = [
        {
          role: "user",
          content: ` 
          Analyze this image and return a detailed JSON description of the items in the image. if you see thousands separator, as dot keep it as it is. if you see decimal separator, as comma keep it as it is. do not change the format of the numbers in the response. keep the decimal . do not duplicate the items in the response.,
          if you see thousands separator, as dot keep it as it is. if you see decimal separator, as comma keep it as it is. do not change the format of the numbers in the response. keep the decimal . do not duplicate the items in the response.,
        In Europe, the decimal separator is a comma (e.g., 1.234,56)
        In the US, the decimal separator is a dot (e.g., 1,234.56).
        do not change the format of the numbers in the response. keep the decimal.
        
       
        `,
          images: pages,
        },
      ];
      imageAnalysis = await analyzeImage(messages);
      return res.json(imageAnalysis);
    } else {
      const messages = [
        {
          role: "user",
          content: `Analyze this image and return a detailed JSON description of the items in the image. if you see thousands separator, as dot keep it as it is. if you see decimal separator, as comma keep it as it is. do not change the format of the numbers in the response. keep the decimal . do not duplicate the items in the response.,
        In Europe, the decimal separator is a comma (e.g., 1.234,56)
        In the US, the decimal separator is a dot (e.g., 1,234.56).
        Item number or Item. can have letters, numbers and -. for example LAT0279-0030-22.
        `,
          images: [base64Image],
        },
      ];
      imageAnalysis = await analyzeImage(messages);
    }

    res.json(imageAnalysis);
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
