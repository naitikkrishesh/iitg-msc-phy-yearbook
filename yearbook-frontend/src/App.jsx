import { useEffect, useState, useCallback } from "react";
import StudentGrid from "./components/StudentGrid";
import StudentProfile from "./components/StudentProfile";
import LoginPanel from "./components/LoginPanel";
import Dashboard from "./components/Dashboard";
import ProfileWorkspace from "./components/ProfileWorkspace";
import { listStudents, getDefaultBatch, getStudentDetail } from "./api/students";
import { getMyProfile } from "./api/dashboard";
import { logout as apiLogout } from "./api/auth";
import { setToken } from "./api/client";
import "./styles/App.css";

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

function App() {
  const [selectedYear, setSelectedYear] = useState(currentYear - 1); // default = Graduating batch
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isProfileWorkspaceOpen, setIsProfileWorkspaceOpen] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [loadError, setLoadError] = useState("");

  const normalizeCard = (s) => ({
    id: s.user_id,
    name: s.name,
    rollNo: s.roll_no,
    year: s.batch_year,
    photo: s.profile_photo,
    quote: s.quote,
    positionTitle: s.position_title,
    batchTag: s.batch_tag,
  });

  const loadStudentsForYear = useCallback(async (year) => {
    try {
      const rows = await listStudents(year);
      setStudentList(rows.map(normalizeCard));
      setLoadError("");
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  // On first load: default to the graduating batch (from backend, in case
  // "current year" logic ever needs to move server-side without a redeploy).
  useEffect(() => {
    getDefaultBatch()
      .then((d) => setSelectedYear(d.batch_year))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStudentsForYear(selectedYear);
  }, [selectedYear, loadStudentsForYear]);

  // Restore session if a token is already in localStorage
  useEffect(() => {
    const token = localStorage.getItem("yearbookToken");
    if (!token) return;
    getMyProfile()
      .then((data) => setCurrentUser(data.user))
      .catch(() => setToken(null));
  }, []);

  const refreshData = () => {
    loadStudentsForYear(selectedYear);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    refreshData();
    setIsLoginOpen(false);
  };

  const handleRegister = () => {
    refreshData();
  };

  const handleLogout = () => {
    apiLogout();
    setCurrentUser(null);
    setIsDashboardOpen(false);
    setIsProfileWorkspaceOpen(false);
  };

  const handleProfileButtonClick = () => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    // access_type: 1 super admin, 2 admin, 3 coordinator, 4 user
    if (currentUser.access_type === 4) {
      setIsProfileWorkspaceOpen(true);
    } else {
      setIsDashboardOpen(true);
    }
  };

  // Index of the currently viewed student within the year's list
  const selectedStudentIndex = selectedStudent
    ? studentList.findIndex((s) => s.id === selectedStudent.id)
    : -1;

  // Navigate prev (-1) or next (+1) within the current year's students
  const handleNavigate = async (direction) => {
    if (selectedStudentIndex === -1) return;
    const nextIndex = selectedStudentIndex + direction;
    if (nextIndex >= 0 && nextIndex < studentList.length) {
      setSelectedStudent(studentList[nextIndex]);
    }
  };

  const handleStudentClick = async (student) => {
    // Fetch full detail (feature photo, about, socials, memories, etc.)
    try {
      const detail = await getStudentDetail(student.id);
      // console.log(detail)
      setSelectedStudent({ ...student, ...normalizeDetail(detail) });
    } catch {
      setSelectedStudent(student);
    }
  };

  const normalizeDetail = (d) => ({
    id: d.user_id,
    name: d.name,
    rollNo: d.roll_no,
    year: d.batch_year,
    photo: d.feature_photo,
    quote: d.quote,
    tagline: d.tagline,
    about: d.about,
    physicsLike: d.physics_like,
    areaOfInterest: d.area_of_interest,
    hobbies: d.hobbies,
    proudOf: d.proud_of,
    phd: d.phd,
    academic: d.academic,
    jobs: d.jobs,
    linkedin: d.linkedin,
    instagram: d.instagram,
    footerQuote: d.footer_quote,
    positionTitle: d.position_title,
    additionalPhotos: (d.additional_photos || []).map((p) => ({ src: p.photo_url, caption: p.caption })),
    coreMemories: (d.core_memories || []).map((m) => ({
      id: m.id,
      title: m.title,
      text: m.memory_text,
      photos: (m.photos || []).map((p) => p.photo_url),
    })),
  });

  return (
    <div className="app">
      <header className="header">
        <div className="title-section">
          <div className="logo-placeholder">
            <h1>YearBook</h1>
          </div>

          <p>MSC. PHYSICS YEARBOOK IITG</p>
        </div>

        <button className="profile-button" onClick={handleProfileButtonClick}>
          <span className="profile-icon">♟</span>

          <span className="login-button-text">
            {currentUser ? currentUser.name : "Login"}
          </span>
        </button>
      </header>

      <div className="board-frame">
        <nav className="year-nav">
          <div className="year-list">
            {years.map((year) => (
              <button
                key={year}
                className={selectedYear === year ? "year-button active" : "year-button"}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </nav>

        <main className="main-content">
          <section className="yearbook-area">
            <div className="yearbook-content">
              <h2>{selectedYear} Batch</h2>

              {loadError && <p className="auth-message">{loadError}</p>}

              <StudentGrid students={studentList} onStudentClick={handleStudentClick} />
            </div>
          </section>
        </main>
      </div>
 
      <footer className="footer">
        <span>Have some queries?</span>
        <button>Contact us</button>
      </footer>

      {isLoginOpen && !currentUser && (
        <LoginPanel
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {isDashboardOpen && currentUser && (
        <Dashboard
          user={currentUser}
          onLogout={handleLogout}
          onClose={() => setIsDashboardOpen(false)}
          onProfileUpdated={refreshData}
        />
      )}

      {isProfileWorkspaceOpen && currentUser && (
        <ProfileWorkspace
          user={currentUser}
          onClose={() => setIsProfileWorkspaceOpen(false)}
          onLogout={handleLogout}
          onProfileUpdated={refreshData}
        />
      )}

      {selectedStudent && (
        <StudentProfile
          student={selectedStudent}
          currentUser={currentUser}
          students={studentList}
          allStudents={studentList}
          years={years}
          selectedYear={selectedYear}
          currentIndex={selectedStudentIndex}
          onClose={() => setSelectedStudent(null)}
          onNavigate={handleNavigate}
          onSelectStudent={handleStudentClick}
          onSelectYear={(year) => {
            setSelectedYear(year);
            setSelectedStudent(null);
          }}
          onMyProfile={handleProfileButtonClick}
        />
      )}
    </div>
  );
}

export default App;
