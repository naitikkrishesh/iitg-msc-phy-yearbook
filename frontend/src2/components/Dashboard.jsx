import { useState } from "react";
import UserManagement from "./UserManagement";
import ContentApproval from "./ContentApproval";
import RosterManagement from "./RosterManagement";
import DomainManagement from "./DomainManagement";
import ProfileWorkspace from "./ProfileWorkspace";

const ACCESS = { SUPER_ADMIN: 1, ADMIN: 2, COORDINATOR: 3, USER: 4 };

function Dashboard({ user, onLogout, onClose, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState("admin");

  const titles = {
    [ACCESS.SUPER_ADMIN]: "Super Admin Dashboard",
    [ACCESS.ADMIN]: "Admin Dashboard",
    [ACCESS.COORDINATOR]: "Coordinator Dashboard",
  };
  const title = titles[user.access_type] || "Dashboard";

  const canManageRoster = user.access_type === ACCESS.SUPER_ADMIN || user.access_type === ACCESS.ADMIN;
  const canManageDomains = user.access_type === ACCESS.SUPER_ADMIN;

  return (
    <div className="dashboard-overlay">
      <div className="dashboard">
        <div className="dashboard-header">
          <button onClick={onClose} className="dashboard-back-button">
            ← Back
          </button>

          <div className="dashboard-heading">
            <h2>{title}</h2>
            <p>Welcome, {user.name}</p>
          </div>

          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            User Management
          </button>

          <button
            className={`dashboard-tab ${activeTab === "approval" ? "active" : ""}`}
            onClick={() => setActiveTab("approval")}
          >
            Content Approval
          </button>

          {canManageRoster && (
            <button
              className={`dashboard-tab ${activeTab === "roster" ? "active" : ""}`}
              onClick={() => setActiveTab("roster")}
            >
              Student Roster
            </button>
          )}

          {canManageDomains && (
            <button
              className={`dashboard-tab ${activeTab === "domains" ? "active" : ""}`}
              onClick={() => setActiveTab("domains")}
            >
              Email Domains
            </button>
          )}

          <button
            className={`dashboard-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            My Profile
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === "admin" && <UserManagement currentUser={user} />}

          {activeTab === "approval" && <ContentApproval currentUser={user} />}

          {activeTab === "roster" && canManageRoster && <RosterManagement />}

          {activeTab === "domains" && canManageDomains && <DomainManagement />}

          {activeTab === "profile" && (
            <div className="dashboard-profile-section">
              <ProfileWorkspace
                user={user}
                isEmbedded
                onClose={() => setActiveTab("admin")}
                onLogout={onLogout}
                onProfileUpdated={onProfileUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
