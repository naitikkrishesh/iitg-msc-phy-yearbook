import { useEffect, useState } from "react";
import { listPendingPhotos, reviewPhoto } from "../../api/admin";
import { fileUrl } from "../../api/client";

function ContentApproval({ currentUser }) {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");
  const [rejectReason, setRejectReason] = useState({});

  const load = () => {
    listPendingPhotos()
      .then(setPending)
      .catch((e) => setMessage(e.message));
  };

  useEffect(load, []);

  const isSuperAdmin = currentUser.access_type === 1;

  const decide = async (userId, photoType, decision) => {
    try {
      await reviewPhoto({
        userId,
        photoType,
        decision,
        rejectReason: rejectReason[`${userId}-${photoType}`] || "",
      });
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="content-approval">
      <div className="management-title approval-title">
        <h3>Content Approval</h3>
        <p>Review user-submitted photos before they appear on the yearbook.</p>
      </div>

      <div className="approval-content">
        {message && <p className="auth-message">{message}</p>}

        {pending.length === 0 ? (
          <div className="approval-empty">
            <div className="approval-icon">✓</div>
            <h4>No Pending Content</h4>
            <p>New photos submitted by users will appear here for review.</p>
          </div>
        ) : (
          <div className="user-management-list">
            {pending.map((p) => {
              const selfLocked = p.user_id === currentUser.id && !isSuperAdmin;
              return (
                <div className="managed-user" key={p.user_id} style={{ flexWrap: "wrap" }}>
                  <div className="managed-user-info">
                    <div>
                      <h4>{p.name}</h4>
                      <p>{p.roll_no}</p>
                      {selfLocked && (
                        <span className="role-badge admin">You cannot review your own photos</span>
                      )}
                    </div>
                  </div>

                  <div className="managed-user-actions">
                    {p.profile_photo_status === "pending" && (
                      <div className="position-assign" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        <img
                          src={fileUrl(p.profile_photo_pending)}
                          alt="Pending profile"
                          style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 3 }}
                        />
                        <span className="role-badge user">Profile photo</span>
                        <input
                          type="text"
                          placeholder="Reason if rejecting"
                          value={rejectReason[`${p.user_id}-profile`] || ""}
                          onChange={(e) =>
                            setRejectReason((r) => ({ ...r, [`${p.user_id}-profile`]: e.target.value }))
                          }
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="promote-button"
                            disabled={selfLocked}
                            onClick={() => decide(p.user_id, "profile", "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="demote-button"
                            disabled={selfLocked}
                            onClick={() => decide(p.user_id, "profile", "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {p.feature_photo_status === "pending" && (
                      <div className="position-assign" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                        <img
                          src={fileUrl(p.feature_photo_pending)}
                          alt="Pending feature"
                          style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 3 }}
                        />
                        <span className="role-badge user">Feature photo</span>
                        <input
                          type="text"
                          placeholder="Reason if rejecting"
                          value={rejectReason[`${p.user_id}-feature`] || ""}
                          onChange={(e) =>
                            setRejectReason((r) => ({ ...r, [`${p.user_id}-feature`]: e.target.value }))
                          }
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="promote-button"
                            disabled={selfLocked}
                            onClick={() => decide(p.user_id, "feature", "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="demote-button"
                            disabled={selfLocked}
                            onClick={() => decide(p.user_id, "feature", "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentApproval;
