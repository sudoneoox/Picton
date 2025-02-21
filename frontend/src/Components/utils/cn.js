import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import "../../styles/output.css";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
