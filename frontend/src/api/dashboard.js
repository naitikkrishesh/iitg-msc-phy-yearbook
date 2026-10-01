import { apiGet, apiJson, apiForm } from "./client";

export function getMyProfile() {
  return apiGet("/api/dashboard/me");
}

export function updateMyProfile(fields) {
  return apiJson("/api/dashboard/profile", "PUT", fields);
}

export function uploadProfilePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  return apiForm("/api/dashboard/photo/profile", "POST", fd);
}

export function uploadFeaturePhoto(file) {
  const fd = new FormData();
  fd.append("file", file);
  return apiForm("/api/dashboard/photo/feature", "POST", fd);
}

export function uploadGalleryPhoto(file, caption) {
  const fd = new FormData();
  fd.append("file", file);
  if (caption) fd.append("caption", caption);
  return apiForm("/api/dashboard/photo/gallery", "POST", fd);
}

export function addCoreMemory(title, memoryText) {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("memory_text", memoryText || "");
  return apiForm("/api/dashboard/core-memory", "POST", fd);
}

export function addCoreMemoryPhoto(memoryId, file) {
  const fd = new FormData();
  fd.append("file", file);
  return apiForm(`/api/dashboard/core-memory/${memoryId}/photo`, "POST", fd);
}

export function getMyNotifications() {
  return apiGet("/api/dashboard/notifications");
}
