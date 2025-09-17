"use client";

import * as React from "react";
import NextLink from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function useNProgress() {
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  const startLoading = () => setIsLoading(true);

  return { isLoading, startLoading };
}

export function PageLoader() {
  const { isLoading } = useNProgress();

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

export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<typeof NextLink>
>(function Link({ onClick, ...props }, ref) {
  const { startLoading } = useNProgress();
  return (
    <NextLink
      ref={ref}
      prefetch={true} // Explicitly enable prefetching
      onClick={(e) => {
        startLoading();
        if (onClick) onClick(e);
      }}
      {...props}
    />
  );
});
Link.displayName = "Link";
