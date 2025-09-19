"use client";

import * as React from "react";
import NextLink, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function useNProgress() {
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    // On new route, stop loading
    setIsLoading(false);
  }, [pathname, searchParams]);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);

  return { isLoading, startLoading, stopLoading };
}

export function PageLoader() {
  const { isLoading } = useNProgressContext();

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-[9999] w-full h-1"
      style={{
        opacity: isLoading ? 1 : 0,
        transition: "opacity 300ms ease-in-out",
      }}
    >
      <div className="h-full bg-gradient-to-r from-primary to-purple-500 animate-[indeterminate_1.5s_ease-in-out_infinite]" />
      <style jsx>{`
        @keyframes indeterminate {
          0% {
            transform: translateX(-100%) scaleX(0.1);
          }
          50% {
            transform: translateX(0) scaleX(0.7);
          }
          100% {
            transform: translateX(100%) scaleX(0.1);
          }
        }
      `}</style>
    </div>
  );
}

// Create a context to share the loading state
const NProgressContext = React.createContext<{
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
} | null>(null);

// Create a provider component that will wrap the app
export function NProgressProvider({ children }: { children: React.ReactNode }) {
  const progress = useNProgress();
  return (
    <NProgressContext.Provider value={progress}>
      {children}
    </NProgressContext.Provider>
  );
}

// Custom hook to use the context
export function useNProgressContext() {
  const context = React.useContext(NProgressContext);
  if (context === null) {
    throw new Error("useNProgressContext must be used within a NProgressProvider");
  }
  return context;
}

const ClientLink = React.forwardRef<
  HTMLAnchorElement,
  React.PropsWithChildren<LinkProps> & React.HTMLAttributes<HTMLAnchorElement>
>(function ClientLink({ href, onClick, children, ...props }, ref) {
  const { startLoading } = useNProgressContext();

  return (
    <NextLink
      href={href}
      ref={ref}
      onClick={(e) => {
        startLoading();
        if (onClick) {
          onClick(e);
        }
      }}
      {...props}
    >
      {children}
    </NextLink>
  );
});
ClientLink.displayName = "ClientLink";

// Export the server-safe Link component
export const Link = ClientLink;
