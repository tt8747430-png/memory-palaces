// Captured verbatim from shadcn Base-UI registry:
// https://ui.shadcn.com/code/apps/v4/registry/bases/base/lib/utils.ts
// NOTE: byte-identical to this repo's src/shared/lib/cn.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
