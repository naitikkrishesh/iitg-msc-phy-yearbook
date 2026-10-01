export function formatSession(year) {
  if (!year) return "2025 – 2027";
  return `${year} – ${year + 2}`;
}

export function getStudentRollNo(student) {
  if (student?.rollNo) return student.rollNo;
  if (!student) return "";
  const yearPrefix = student.year ? String(student.year).slice(-2) : "25";
  return `${yearPrefix}212300${student.id || "1"}`;
}

export function normalizeAdditionalPhoto(photo) {
  if (typeof photo === "string") {
    return { src: photo, caption: "" };
  }

  return {
    src: photo?.src || "",
    caption: photo?.caption || "",
  };
}

export function getStudentComments(rollNo) {
  try {
    const comments = JSON.parse(
      localStorage.getItem("yearbookComments") || "{}"
    );
    return Array.isArray(comments[rollNo]) ? comments[rollNo] : [];
  } catch {
    return [];
  }
}

export function addStudentComment(rollNo, comment) {
  const comments = getStudentComments(rollNo);
  const nextComment = {
    id: Date.now(),
    name: comment.name.trim(),
    text: comment.text.trim(),
    createdAt: new Date().toISOString(),
  };
  let allComments = {};

  try {
    allComments = JSON.parse(
      localStorage.getItem("yearbookComments") || "{}"
    );
  } catch {
    allComments = {};
  }

  allComments[rollNo] = [...comments, nextComment];
  localStorage.setItem("yearbookComments", JSON.stringify(allComments));
  return allComments[rollNo];
}