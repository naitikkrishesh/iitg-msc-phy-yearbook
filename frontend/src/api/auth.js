import { apiGet, apiJson, setToken } from "./client";

export function getRegistrationBatchYears() {
  return apiGet("/api/auth/registration/batch-years");
}

export function requestRegistrationOtp({ batchYear, name, rollNo, email }) {
  return apiJson("/api/auth/registration/request-otp", "POST", {
    batch_year: batchYear,
    name,
    roll_no: rollNo,
    email,
  });
} 

export async function completeRegistration({ batchYear, name, rollNo, email, otp, password }) {
  const data = await apiJson("/api/auth/registration/complete", "POST", {
    batch_year: batchYear,
    name,
    roll_no: rollNo,
    email,
    otp,
    password,
  });
  setToken(data.access_token);
  return data.user;
}

export async function login(rollNo, password) {
  const data = await apiJson("/api/auth/login", "POST", {
    roll_no: rollNo,
    password,
  });
  setToken(data.access_token);
  return data.user;
}

export function logout() {
  setToken(null);
}

export function requestPasswordResetOtp(email) {
  return apiJson("/api/auth/forgot-password/request-otp", "POST", { email });
}

export function resetPassword({ email, otp, newPassword }) {
  return apiJson("/api/auth/forgot-password/reset", "POST", {
    email,
    otp,
    new_password: newPassword,
  });
}
