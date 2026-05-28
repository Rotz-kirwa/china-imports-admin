import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="MI and IN Global"
      className={cn("h-8 w-8 object-contain flex-shrink-0", className)}
    />
  );
}
