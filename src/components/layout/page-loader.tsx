"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

// CONTEXT
// =================================================================================================
const NProgressContext = React.createContext<{
  isLoading: boolean;
  startLoading: () => void;
} | null>(null);

export function useNProgressContext() {
  const context = React.useContext(NProgressContext);
  if (context === null) {
    throw new Error("useNProgressContext must be used within a NProgressProvider");
  }
  return context;
}

// PROVIDER
// =================================================================================================
function NProgressProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  
  const value = React.useMemo(() => ({
    isLoading,
    startLoading,
  }), [isLoading, startLoading]);

  return (
    <NProgressContext.Provider value={value}>
      {children}
    </NProgressContext.Provider>
  );
}

// VISUAL LOADER
// =================================================================================================
function Loader() {
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
    )
}

// WRAPPER COMPONENT (for layout.tsx)
// =================================================================================================
// This is the component that will be wrapped in <Suspense>
export function PageLoader({ children }: { children: React.ReactNode }) {
    return (
        <NProgressProvider>
            <Loader/>
            {children}
        </NProgressProvider>
    )
}
