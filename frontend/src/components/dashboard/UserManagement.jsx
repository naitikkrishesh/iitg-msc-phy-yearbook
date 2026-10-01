import { useEffect, useState } from "react";
import { listUsers, updateRole, approveUser, assignPosition } from "../../api/admin";

const ACCESS = { SUPER_ADMIN: 1, ADMIN: 2, COORDINATOR: 3, USER: 4 };
const roleLabel = (t) => ({ 1: "Super Admin", 2: "Admin", 3: "Coordinator", 4: "User" }[t] || "User");
const roleClass = (t) => ({ 1: "superadmin", 2: "admin", 3: "coordinator", 4: "user" }[t] || "user");

const POSITION_OPTIONS = ["", "CR", "DPR", "Other"];

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [customPosition, setCustomPosition] = useState({});

  const load = () => {
    listUsers()
      .then(setUsers)
      .catch((e) => setMessage(e.message));
  };

  useEffect(load, []);

  const isSuperAdmin = currentUser.access_type === ACCESS.SUPER_ADMIN;
  const isAdmin = currentUser.access_type === ACCESS.ADMIN;
  const canManageRoles = isSuperAdmin || isAdmin;
  const canAssignPosition = isSuperAdmin || isAdmin || currentUser.access_type === ACCESS.COORDINATOR;

  const handleRoleChange = async (userId, newAccessType) => {
    try {
      await updateRole(userId, newAccessType);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleApprove = async (userId, approve) => {
    try {
      await approveUser(userId, approve);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handlePositionChange = async (userId, value) => {
    if (value === "Other") return; // wait for custom text submit
    try {
      await assignPosition(userId, value);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const submitCustomPosition = async (userId) => {
    const value = (customPosition[userId] || "").trim();
    if (!value) return;
    try {
      await assignPosition(userId, value);
      setCustomPosition((p) => ({ ...p, [userId]: "" }));
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="user-management">
      <div className="management-title">
        <h3>User &amp; Role Management</h3>
        <p>
          Approve new registrations, manage admin/coordinator access, and set positions of
          responsibility.
        </p>
      </div>

      {message && <p className="auth-message">{message}</p>}

      <div className="user-management-list">
        {users.length === 0 ? (
          <p className="no-users">No users are available to manage.</p>
        ) : (
          users.map((u) => {
            const selfLocked = u.id === currentUser.id && !isSuperAdmin;
            return (
              <div className="managed-user" key={u.id}>
                <div className="managed-user-info">
                  <img
                    src="https://placehold.co/100x100"
                    alt={u.name}
                    className="managed-user-photo"
                  />

                  <div>
                    <h4>{u.name}</h4>
                    <p>{u.roll_no} · Batch {u.batch_year}</p>

                    <span className={`role-badge ${roleClass(u.access_type)}`}>
                      {roleLabel(u.access_type)}
                    </span>

                    <span className={`role-badge ${u.approved_at ? "user" : "admin"}`}>
                      {u.approved_at ? "Approved" : "Pending approval"}
                    </span>
                  </div>
                </div>

                <div className="managed-user-actions">
                  {!u.approved_at && (
                    <button
                      className="promote-button"
                      disabled={selfLocked}
                      title={selfLocked ? "You cannot approve your own account" : ""}
                      onClick={() => handleApprove(u.id, true)}
                    >
                      Approve
                    </button>
                  )}
                  {u.approved_at && (
                    <button
                      className="demote-button"
                      disabled={selfLocked}
                      title={selfLocked ? "You cannot un-approve your own account" : ""}
                      onClick={() => handleApprove(u.id, false)}
                    >
                      Un-approve
                    </button>
                  )}

                  {canManageRoles && u.access_type !== ACCESS.SUPER_ADMIN && (
                    <>
                      {u.access_type === ACCESS.USER && (
                        <button className="promote-button" onClick={() => handleRoleChange(u.id, ACCESS.COORDINATOR)}>
                          Make Coordinator
                        </button>
                      )}
                      {u.access_type === ACCESS.COORDINATOR && (
                        <button className="demote-button" onClick={() => handleRoleChange(u.id, ACCESS.USER)}>
                          Remove Coordinator
                        </button>
                      )}
                      {isSuperAdmin && u.access_type !== ACCESS.ADMIN && (
                        <button className="promote-button" onClick={() => handleRoleChange(u.id, ACCESS.ADMIN)}>
                          Make Admin
                        </button>
                      )}
                      {isSuperAdmin && u.access_type === ACCESS.ADMIN && (
                        <button className="demote-button" onClick={() => handleRoleChange(u.id, ACCESS.USER)}>
                          Remove Admin
                        </button>
                      )}
                    </>
                  )}

                  {canAssignPosition && (
                    <div className="position-assign">
                      <select
                        defaultValue=""
                        onChange={(e) => handlePositionChange(u.id, e.target.value)}
                      >
                        <option value="" disabled>
                          Assign position…
                        </option>
                        {POSITION_OPTIONS.filter((o) => o !== "").map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                        <option value="">Clear position</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Custom title…"
                        value={customPosition[u.id] || ""}
                        onChange={(e) => setCustomPosition((p) => ({ ...p, [u.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && submitCustomPosition(u.id)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserManagement;
