import { apiGet, apiJson, apiForm } from "./client";

// Roster
export function listRoster() {
  return apiGet("/api/admin/students");
}
export function addStudentManual({ batchYear, name, rollNo, iitgEmail }) {
  return apiJson("/api/admin/students", "POST", {
    batch_year: batchYear,
    name,
    roll_no: rollNo,
    iitg_email: iitgEmail,
  });
}
export function importStudentsExcel(file) {
  const fd = new FormData();
  fd.append("file", file);
  return apiForm("/api/admin/students/import-excel", "POST", fd);
}

// Allowed domains (super admin)
export function listDomains() {
  return apiGet("/api/admin/domains");
}
export function addDomain(domain) {
  return apiJson("/api/admin/domains", "POST", { domain });
}
export function removeDomain(domainId) {
  return apiJson(`/api/admin/domains/${domainId}`, "DELETE");
}

// Users / roles / approval
export function listUsers() {
  return apiGet("/api/admin/users");
}
export function updateRole(userId, newAccessType) {
  return apiJson("/api/admin/users/role", "PUT", {
    user_id: userId,
    new_access_type: newAccessType,
  });
}
export function approveUser(userId, approve) {
  return apiJson("/api/admin/users/approve", "PUT", { user_id: userId, approve });
}

// Review (details + photos) for a single user
export function listPendingPhotos() {
  return apiGet("/api/admin/photo/pending");
}
export function reviewUserDetail(userId) {
  return apiGet(`/api/admin/users/${userId}/review`);
}
export function reviewPhoto({ userId, photoType, decision, rejectReason }) {
  return apiJson("/api/admin/photo/review", "PUT", {
    user_id: userId,
    photo_type: photoType,
    decision,
    reject_reason: rejectReason,
  });
}

// Position of responsibility (coordinator + admin + super admin)
export function assignPosition(userId, positionTitle) {
  return apiJson("/api/admin/users/position", "PUT", {
    user_id: userId,
    position_title: positionTitle,
  });
}
