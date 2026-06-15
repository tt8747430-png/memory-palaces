import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Single source of truth for className composition (clsx + Tailwind conflict-merge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
