import { UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
      <div className="w-full flex-1">
        {/* Optional: Add search or other header elements here */}
      </div>
      <UserButton />
    </header>
  )
}
