import React from "react";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: Props) {
  const base = "inline-flex items-center justify-center font-semibold rounded-full transition-transform focus:outline-none";
  const sizing = "px-12 py-4 text-lg";
  const primary =
    "bg-[linear-gradient(180deg,var(--brand),var(--brand-dark))] text-white shadow-[0_18px_48px_rgba(16,183,89,0.14)]";
  const ghost =
    "bg-[rgba(255,255,255,0.02)] text-[var(--brand)] border border-[rgba(255,255,255,0.06)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]";

  const classes = clsx(base, sizing, variant === "primary" ? primary : ghost, className);

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}