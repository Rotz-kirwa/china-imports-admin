import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="MI&IN GLOBAL IMPORTERS logo"
      className={cn("h-8 w-8 flex-shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="16" fill="#0f233d" />
      <path
        d="M17 38c7.5 6.6 22.5 6.6 30 0"
        fill="none"
        stroke="#d4af37"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M16 26c8-6.5 24-6.5 32 0"
        fill="none"
        stroke="#d4af37"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".75"
      />
      <path
        d="M32 14c6 7 6 29 0 36M32 14c-6 7-6 29 0 36"
        fill="none"
        stroke="#f3d36b"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".9"
      />
      <path
        d="M19 32h26m0 0-6-6m6 6-6 6"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 46h30v4H17z" fill="#d4af37" opacity=".9" />
      <text
        x="32"
        y="25"
        textAnchor="middle"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="10"
        fontWeight="800"
        fill="#ffffff"
        letterSpacing=".5"
      >
        MI
      </text>
    </svg>
  );
}
