import ollama from "ollama";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import multer from "multer";
import express from "express";

const app = express();
const port = 3000;

const storage = multer({ storage: multer.memoryStorage() });
const ObjectSchema = z.object({
  name: z.string().describe("Item name."),
  quantity: z.number().describe("Quantity of the item"),
  price: z.number().describe("Price paid for the item/s"),
  total: z.number().describe("Total price of the item/s"),
});

const ImageDescriptionSchema = z.object({
  items: z.array(ObjectSchema).describe("Items detected in the image."),
  currency: z.string().describe("The currency of the invoice"),
  companyName: z.string().describe("The name of the company on the invoice"),
  companyAddress: z
    .string()
    .describe("The address of the company on the invoice"),
  dateOfInvoice: z.string().optional().describe("The date of the invoice"),
  totalAmount: z.number().describe("The total amount paid in the invoice"),
  shipTo: z.string().optional().describe("ship to address"),
  billTo: z.string().optional().describe("bill to address"),
  invoiceNumber: z.string().optional().describe("invoice number"),
  tax: z.number().optional().describe("tax amount"),
  telephone: z.string().optional().describe("telephone number"),
  methodOfPayment: z
    .string()
    .optional()
    .describe("method of payment. eg. cash/card"),
});

async function analyzeImage(base64Image) {
  try {
    // Convert the Zod schema to JSON Schema format
    const jsonSchema = zodToJsonSchema(ImageDescriptionSchema);
    const model = "llama3.2-vision:11b";
    const models = (await ollama.list()).models;

    // check if ollama has the llama3.2-vision:11b model
    const isModelAvailable = models.some((line) => line.model === model);
    if (!isModelAvailable) {
      throw new Error(
        "Model llama3.2-vision:11b not found. Please run `ollama pull llama3.2-vision:11b`"
      );
    }

    const messages = [
      {
        role: "user",
        content:
          "Analyze this image and return a detailed JSON description of the items in the image.",
        images: [base64Image],
      },
    ];

    const response = await ollama.chat({
      model: model,
      messages: messages,
      format: jsonSchema,
      options: {
        temperature: 0, // Make responses more deterministic
      },
    });
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
    const base64Image = req.file.buffer.toString("base64");
    const imageAnalysis = await analyzeImage(base64Image);
    res.json(imageAnalysis);
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
