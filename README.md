# Analyzing Receipts and Invoices with Llama3.2-Vision:11b and Ollama

This is a Node.js application that uses Express.js to create a web server for analyzing images, specifically receipts. The application accepts image uploads, processes them using the Ollama API and Llama3.2-Vision:11b, and returns a detailed JSON description of the items detected in the image.

## Features

- Upload an image and receive a detailed JSON description of the items in the image.
- Uses Zod for schema validation and conversion to JSON Schema.
- Multer for handling file uploads.
- Express.js for creating the web server.

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/davindersteltix/ollama-receipt-Llama.git
   cd ollama-receipt-Llama
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

## Usage

1. Start the server:

   ```sh
   npm start
   ```

2. Send a POST request to `http://localhost:3000/` with an image file. You can use tools like Postman or cURL for testing.

   Example using cURL:

   ```sh
   curl -X POST -F "image=@path/to/your/image.jpg" http://localhost:3000/
   ```

## Dependencies

- [express](https://www.npmjs.com/package/express)
- [multer](https://www.npmjs.com/package/multer)
- [ollama](https://www.npmjs.com/package/ollama)
- [zod](https://www.npmjs.com/package/zod)
- [zod-to-json-schema](https://www.npmjs.com/package/zod-to-json-schema)
- [nodemon](https://www.npmjs.com/package/nodemon) (dev dependency)
