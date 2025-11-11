// Utility functions for file downloads

export function buildFileUrl(path: string): string {
  // If path is already a full URL, return it
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  // Otherwise, construct the URL relative to the API base
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_BASE}/${cleanPath}`;
}

