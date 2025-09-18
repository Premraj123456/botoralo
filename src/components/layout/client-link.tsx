"use client";

import * as React from "react";
import NextLink, { type LinkProps } from "next/link";
import { useNProgressContext } from './page-loader';

export const ClientLink = React.forwardRef<
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
