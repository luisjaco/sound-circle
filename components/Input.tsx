import React from "react";
import { Mail, Lock } from "lucide-react";
import clsx from "clsx";

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; className?: string };

export default function Input({ label, className = "", type = "text", ...rest }: Props) {
  const Icon = type === "password" ? Lock : type === "email" ? Mail : null;

  return (
    <div className={clsx("form-row")}>
      {label && <label className="input-label">{label}</label>}

      <div className={clsx("input-with-icon", className)}>
        {Icon ? (
          <span className="input-icon" aria-hidden>
            <Icon size={18} strokeWidth={1.6} />
          </span>
        ) : null}

        <input className="input-field" type={type} {...rest} />
      </div>
    </div>
  );
}