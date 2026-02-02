import React from "react";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant="primary", className, children, ...rest }: Props) {
  const base = "px-8 py-3 rounded-pill font-medium inline-flex items-center justify-center";
  const styles = variant === "primary"
    ? "bg-brand text-white hover:bg-brand-dark shadow-md"
    : "bg-transparent border border-faint text-brand hover:bg-white/2";
  return (
    <button className={clsx(base, styles, className)} {...rest}>
      {children}
    </button>
  )
}