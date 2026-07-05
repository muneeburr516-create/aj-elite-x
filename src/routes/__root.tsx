import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { ScrollProgress, ScrollToTop } from "@/components/layout/ScrollUtils";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-2xl p-10 max-w-md text-center">
        <h1 className="font-display text-8xl font-bold text-gradient-red">404</h1>
        <h2 className="mt-4 font-display text-xl tracking-widest uppercase">Off the leaderboard</h2>
        <p className="mt-2 text-sm text-white/60">This page isn't part of the Elite X quest.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors glow-red"
        >
          Return to Base
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong rounded-2xl p-10 max-w-md text-center">
        <h1 className="font-display text-xl uppercase tracking-widest">Session Interrupted</h1>
        <p className="mt-2 text-sm text-white/60">Something misfired on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
          <a href="/" className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5 transition-colors">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Elite X — Top 10 Transformation Quest | AJ Fitness Club" },
      {
        name: "description",
        content:
          "Elite X is AJ Fitness Club's invitation-only 90-day Top 10 Transformation Quest. Track the athletes, leaderboards and the road to champion.",
      },
      { name: "author", content: "AJ Fitness Club" },
      { property: "og:title", content: "Elite X — Top 10 Transformation Quest | AJ Fitness Club" },
      { property: "og:description", content: "The 90-day, invitation-only transformation quest. Meet the 10 elite athletes chasing the AJ Fitness Club championship." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Elite X — Top 10 Transformation Quest | AJ Fitness Club" },
      { name: "description", content: "The 90-day, invitation-only transformation quest. Meet the 10 elite athletes chasing the AJ Fitness Club championship." },
      { name: "twitter:description", content: "The 90-day, invitation-only transformation quest. Meet the 10 elite athletes chasing the AJ Fitness Club championship." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/i2cx1AbZeiMc4VVb14rEuJwzjOk1/social-images/social-1783235274784-2c8cad64-ade4-48af-a4da-3d969af3f448.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/i2cx1AbZeiMc4VVb14rEuJwzjOk1/social-images/social-1783235274784-2c8cad64-ade4-48af-a4da-3d969af3f448.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
          <Toaster theme="dark" position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AnimatedBackground />
        <ScrollProgress />
        <Navbar />
        <main className="pt-24">
          <Outlet />
        </main>
        <Footer />
        <ScrollToTop />
        <Toaster theme="dark" position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
