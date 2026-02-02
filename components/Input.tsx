import React from "react";
import clsx from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: React.ReactNode };

export default function Input({ label, icon, className, ...rest }: Props) {
  return (
    <div className="w-full">
      {label && <label className="block mb-2 text-sm text-muted">{label}</label>}
      <div className="flex items-center gap-3 bg-[#1a1a1a] border faint rounded-xl px-4 py-3">
        {icon && <div className="opacity-60">{icon}</div>}
        <input className={clsx("bg-transparent outline-none w-full text-sm", className)} {...rest} />
      </div>
    </div>
  )
}