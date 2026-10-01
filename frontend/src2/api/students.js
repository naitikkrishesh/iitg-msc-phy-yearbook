import { apiGet } from "./client";

/** Years currently present in the admin-uploaded student roster. */
export function getAvailableBatchYears() {
  return apiGet("/api/students/years");
}

export function listStudents(batchYear) {
  const qs = batchYear ? `?batch_year=${batchYear}` : "";
  return apiGet(`/api/students${qs}`);
}

export function getStudentDetail(userId) {
  return apiGet(`/api/students/${userId}`);
}
