// A Pages Router API route that renders an email (see src/lib/email.ts), in the Node.js runtime.
import type { NextApiRequest, NextApiResponse } from "next";
import { emailCounts } from "@/lib/email";

export default function handler(_request: NextApiRequest, response: NextApiResponse) {
  response.status(200).json(emailCounts());
}
