import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const HIDE_SCROLLBAR = 'overflow-scroll [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';