import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <div role="img" aria-label="MI and IN Global" className={cn("flex items-center", className)}>
      <div className="text-base md:text-lg font-extrabold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        <span className="font-extrabold">MI &amp; </span>
        <span className="italic font-extrabold text-amber-200">IN Global</span>
      </div>
    </div>
  );
}
