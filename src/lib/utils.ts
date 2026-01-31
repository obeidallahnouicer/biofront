import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return formatDate(d);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function generateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getMaterialTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    paper: "📄",
    sequence: "🧬",
    image: "🖼️",
    experiment: "🧪",
    note: "📝",
  };
  return icons[type] || "📁";
}

export function getMaterialTypeColor(type: string): string {
  const colors: Record<string, string> = {
    paper: "bg-blue-100 text-blue-800",
    sequence: "bg-green-100 text-green-800",
    image: "bg-purple-100 text-purple-800",
    experiment: "bg-orange-100 text-orange-800",
    note: "bg-yellow-100 text-yellow-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}

export function getStorageBucketForMaterialType(type: string): string {
  const buckets: Record<string, string> = {
    paper: "bioloupe-papers",
    sequence: "bioloupe-sequences",
    image: "bioloupe-images",
    experiment: "bioloupe-experimental-data",
    note: "bioloupe-papers",
  };
  return buckets[type] || "bioloupe-papers";
}

export function parseSequence(sequence: string): {
  type: "protein" | "dna" | "rna" | "unknown";
  length: number;
  isValid: boolean;
} {
  const cleanedSequence = sequence.replace(/\s/g, "").toUpperCase();
  const length = cleanedSequence.length;

  // Check for DNA
  if (/^[ATCG]+$/.test(cleanedSequence)) {
    return { type: "dna", length, isValid: true };
  }

  // Check for RNA
  if (/^[AUCG]+$/.test(cleanedSequence)) {
    return { type: "rna", length, isValid: true };
  }

  // Check for Protein (20 standard amino acids)
  if (/^[ACDEFGHIKLMNPQRSTVWY]+$/.test(cleanedSequence)) {
    return { type: "protein", length, isValid: true };
  }

  return { type: "unknown", length, isValid: false };
}

export function formatSequence(sequence: string, lineLength: number = 60): string {
  const cleaned = sequence.replace(/\s/g, "").toUpperCase();
  const lines: string[] = [];
  for (let i = 0; i < cleaned.length; i += lineLength) {
    lines.push(cleaned.slice(i, i + lineLength));
  }
  return lines.join("\n");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidDoi(doi: string): boolean {
  const doiRegex = /^10\.\d{4,}\/[^\s]+$/;
  return doiRegex.test(doi);
}
