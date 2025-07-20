import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidObjectId(id: any): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export function validateObjectId(id: any): string | null {
  return isValidObjectId(id) ? id : null;
}
