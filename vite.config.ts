import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const adminPort = Number(process.env.ADMIN_PORT || 8081);
const adminPreviewPort = Number(process.env.ADMIN_PREVIEW_PORT || 4174);
const backendPort = Number(process.env.BACKEND_PORT || 4000);
// On Vercel the admin deploys as its own project at root → base must be "/"
// In local dev it's proxied under /admin/ by the storefront dev server → base = "/admin/"
const adminBase = process.env.ADMIN_BASE_PATH || (process.env.VERCEL ? "/" : "/admin/");

function createAdminBaseRedirectPlugin(basePath: string) {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const ignoredPrefixes = [normalizedBase, "/api", "/@vite", "/@react-refresh", "/__vite", "/node_modules", "/src", "/assets"];

  const redirectToBase = (request: { method?: string; url?: string; headers: Record<string, string | string[] | undefined> }, response: { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void; }, next: () => void) => {
    if (request.method !== "GET" || !request.url) {
      next();
      return;
    }

    const accept = request.headers.accept;
    const acceptsHtml = Array.isArray(accept) ? accept.some((value) => value.includes("text/html")) : accept?.includes("text/html");
    if (!acceptsHtml) {
      next();
      return;
    }

    const [pathname, search = ""] = request.url.split("?");
    if (!pathname) {
      next();
      return;
    }

    if (ignoredPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
      next();
      return;
    }

    if (pathname.includes(".")) {
      next();
      return;
    }

    const normalizedPath = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
    const target = `${normalizedBase}${normalizedPath}`.replace(/\/{2,}/g, "/");
    const location = search ? `${target}?${search}` : target;

    response.statusCode = 302;
    response.setHeader("Location", location);
    response.end();
  };

  return {
    name: "admin-base-redirect",
    configureServer(server: { middlewares: { use: (handler: typeof redirectToBase) => void } }) {
      server.middlewares.use(redirectToBase);
    },
    configurePreviewServer(server: { middlewares: { use: (handler: typeof redirectToBase) => void } }) {
      server.middlewares.use(redirectToBase);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // Keep the admin app mounted under /admin in both dev and production so
  // the connected storefront proxy and the standalone admin use the same routes.
  base: adminBase,
  server: {
    host: "::",
    port: adminPort,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: "::",
    port: adminPreviewPort,
  },
  plugins: [createAdminBaseRedirectPlugin(adminBase), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "lucide-react"],
          ui: ["@radix-ui/react-accordion", "@radix-ui/react-dialog", "@radix-ui/react-slot", "class-variance-authority", "clsx", "tailwind-merge"],
          utils: ["@tanstack/react-query", "zod", "date-fns"],
          charts: ["recharts"]
        }
      }
    }
  },
  optimizeDeps: {
    entries: ["index.html"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
