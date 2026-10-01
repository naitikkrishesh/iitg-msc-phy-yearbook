import { useCallback, useEffect, useState } from "react";
import StudentGrid from "./components/students/StudentGrid";
import StudentProfile from "./components/profile/StudentProfile";
import LoginPanel from "./components/auth/LoginPanel";
import Dashboard from "./components/dashboard/Dashboard";
import ProfileWorkspace from "./components/profile/ProfileWorkspace";
import { getAvailableBatchYears, listStudents } from "./api/students";
import { getMyProfile } from "./api/dashboard";
import { logout as apiLogout } from "./api/auth";
import { setToken } from "./api/client";
import { getBatchStatus, getDefaultBatchYear } from "./utils/batch";
import { normalizeStudentCard } from "./utils/student";
import "./styles/App.css";

function App() {
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isProfileWorkspaceOpen, setIsProfileWorkspaceOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [yearsLoading, setYearsLoading] = useState(true);

  const loadAvailableYears = useCallback(async () => {
    setYearsLoading(true);
    try {
      const years = await getAvailableBatchYears();
      const normalizedYears = years.map(Number).filter(Number.isInteger);
      setAvailableYears(normalizedYears);
      setSelectedYear((current) => {
        if (current && normalizedYears.includes(current)) return current;
        return getDefaultBatchYear(normalizedYears);
      });
      setLoadError("");
    } catch (error) {
      setAvailableYears([]);
      setSelectedYear(null);
      setLoadError(error.message);
    } finally {
      setYearsLoading(false);
    }
  }, []);

  const loadStudentsForYear = useCallback(async (year) => {
    if (!year) {
      setStudentList([]);
      return;
    }

    try {
      const rows = await listStudents(year);
      setStudentList(rows.map((row) => ({
        ...normalizeStudentCard(row),
        batchTag: getBatchStatus(Number(row.batch_year)),
      })));
      setLoadError("");
    } catch (error) {
      setStudentList([]);
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    loadAvailableYears();
  }, [loadAvailableYears]);

  useEffect(() => {
    setSelectedStudentId(null);
    loadStudentsForYear(selectedYear);
  }, [selectedYear, loadStudentsForYear]);

  useEffect(() => {
    const token = localStorage.getItem("yearbookToken");
    if (!token) return;

    getMyProfile()
      .then((data) => setCurrentUser(data.user))
      .catch(() => setToken(null));
  }, []);

  const refreshData = () => {
    loadAvailableYears();
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
  };

  const handleProfileButtonClick = () => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    if (currentUser.access_type === 4) {
      setIsProfileWorkspaceOpen(true);
    } else {
      setIsDashboardOpen(true);
    }
  };

  const handleStudentClick = (studentId) => {
    setSelectedStudentId(Number(studentId));
  };

  const closeStudentProfile = () => setSelectedStudentId(null);

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
            {availableYears.map((year) => (
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
              <h2>{selectedYear ? `${selectedYear} Batch — ${getBatchStatus(selectedYear)}` : "Yearbook"}</h2>

              {yearsLoading && <p className="auth-message">Loading available batches...</p>}
              {!yearsLoading && !availableYears.length && (
                <p className="auth-message">No batches have been uploaded by an admin yet.</p>
              )}
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

      {selectedStudentId && (
        <StudentProfile
          studentId={selectedStudentId}
          selectedYear={selectedYear}
          years={availableYears}
          onClose={closeStudentProfile}
          onSelectStudent={handleStudentClick}
          onSelectYear={(year) => {
            setSelectedYear(year);
            setSelectedStudentId(null);
          }}
          onMyProfile={handleProfileButtonClick}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default App;
