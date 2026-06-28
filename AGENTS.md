<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PDF extraction

Use `unpdf` (not `pdf-parse`) for PDF text extraction. The `pdf-parse` package has worker module resolution issues in Vercel serverless. `unpdf` bundles pdfjs internally with correct worker setup and extracts text reliably.

```ts
import { extractText } from "unpdf";
const buffer = new Uint8Array(await file.arrayBuffer());
const result = await extractText(buffer);
const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
```
