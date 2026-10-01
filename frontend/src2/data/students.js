const defaultStudents = [
  {
    id: 1,
    rollNo: "252123001",
    name: "Student One",
    year: 2025,
    photo: "https://placehold.co/400x400",
    quote: "Somewhere between equations and coffee.",
    tagline: "",
    about: "This is a short introduction about the student.",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  },
  {
    id: 2,
    rollNo: "252123002",
    name: "Student Two",
    year: 2025,
    photo: "https://placehold.co/400x400",
    quote: "Entropy always wins.",
    tagline: "",
    about: "This is a short introduction about the student.",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  },
  {
    id: 3,
    rollNo: "252123003",
    name: "Student Three",
    year: 2025,
    photo: "https://placehold.co/400x400",
    quote: "Still debugging the universe.",
    tagline: "",
    about: "This is a short introduction about the student.",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  },
  {
    id: 4,
    rollNo: "252123004",
    name: "Student Four",
    year: 2025,
    photo: "https://placehold.co/400x400",
    quote: "Physics happened. I survived.",
    tagline: "",
    about: "This is a short introduction about the student.",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  },
  {
    id: 5,
    rollNo: "242123001",
    name: "Student Five",
    year: 2024,
    photo: "https://placehold.co/400x400",
    quote: "One equation at a time.",
    tagline: "",
    about: "This is a short introduction about the student.",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  },
  {
    id: 6,
    rollNo: "262123001",
    name: "Student Six",
    year: 2026,
    photo: "https://placehold.co/400x400",
    quote: "The experiment is only over when the data agrees.",
    tagline: "",
    about:
      "Physics has always been a journey of asking questions rather than simply collecting answers.",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  },
];

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

export function getStudents() {
  const savedStudents = localStorage.getItem("yearbookStudents");

  if (!savedStudents) {
    localStorage.setItem(
      "yearbookStudents",
      JSON.stringify(defaultStudents)
    );

    return defaultStudents;
  }

  try {
    const parsed = JSON.parse(savedStudents);
    // Ensure existing cached students have rollNo
    const populated = parsed.map((student) => ({
      ...student,
      rollNo: getStudentRollNo(student),
    }));
    return populated;
  } catch {
    return defaultStudents;
  }
}

export function getYearFromRollNo(rollNo) {
  const yearPrefix = Number(rollNo.slice(0, 2));

  if (!Number.isInteger(yearPrefix) || yearPrefix < 20) {
    return null;
  }

  return 2000 + yearPrefix;
}

export function addStudentFromUser(user) {
  const students = getStudents();
  const year = getYearFromRollNo(user.rollNo);

  if (!year) {
    return null;
  }

  const existingStudent = students.find(
    (student) =>
      student.rollNo?.toLowerCase() === user.rollNo.toLowerCase()
  );

  if (existingStudent) {
    return existingStudent;
  }

  const newStudent = {
    id: user.id,
    rollNo: user.rollNo,
    name: user.name,
    year,
    photo: user.photo || "https://placehold.co/400x400",
    quote: user.quote || "",
    tagline: "",
    about: "",
    additionalPhotos: [],
    physicsLike: "",
    areaOfInterest: "",
    hobbies: "",
    proudOf: "",
    linkedin: "",
    instagram: "",
    coreMemories: [],
    footerQuote: "",
  };

  const updatedStudents = [...students, newStudent];

  localStorage.setItem(
    "yearbookStudents",
    JSON.stringify(updatedStudents)
  );

  return newStudent;
}

export function updateStudentProfile(rollNo, updates) {
  const students = getStudents();

  const updatedStudents = students.map((student) =>
    student.rollNo === rollNo
      ? { ...student, ...updates }
      : student
  );

  localStorage.setItem(
    "yearbookStudents",
    JSON.stringify(updatedStudents)
  );

  return updatedStudents.find(
    (student) => student.rollNo === rollNo
  );
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