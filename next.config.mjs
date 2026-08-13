import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig = {
  agentRules: false,
  reactCompiler: true,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
