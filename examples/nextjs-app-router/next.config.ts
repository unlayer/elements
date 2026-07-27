import { dirname } from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@unlayer/react-elements"],
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
