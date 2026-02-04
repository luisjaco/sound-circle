import { Disc3 } from "lucide-react";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 100, className = "" }: LogoProps) {
  return (
    <Disc3
      size={size}
      strokeWidth={2}
      className={`text-[var(--brand)] animate-spin-slow ${className}`}
      aria-hidden
    />
  );
}
