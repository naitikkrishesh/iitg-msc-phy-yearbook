import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  uploadFeaturePhoto,
  uploadGalleryPhoto,
  addCoreMemory as apiAddCoreMemory,
  addCoreMemoryPhoto as apiAddCoreMemoryPhoto,
  getMyNotifications,
} from "../../api/dashboard";
import { fileUrl } from "../../api/client";

const emptyDetails = {
  quote: "", tagline: "", about: "",
  physics_like: "", area_of_interest: "", hobbies: "", proud_of: "",
  phd: "", academic: "", jobs: "",
  linkedin: "", instagram: "", footer_quote: "", position_title: "",
  profile_photo_current: null, profile_photo_pending: null, profile_photo_status: "none", profile_photo_reject_reason: null,
  feature_photo_current: null, feature_photo_pending: null, feature_photo_status: "none", feature_photo_reject_reason: null,
};

function PhotoStatusNote({ status, rejectReason }) {
  if (status === "pending") {
    return <p className="pw-hint">Awaiting admin approval. Your previous photo stays live until this is reviewed.</p>;
  }
  if (status === "rejected") {
    return <p className="auth-message">Not approved: {rejectReason || "did not meet the required standard."} Your previous photo is still shown.</p>;
  }
  if (status === "approved") {
    return <p className="pw-hint">✓ Approved and live.</p>;
  }
  return null;
}

function ProfileWorkspace({ user, onClose, onLogout, onProfileUpdated, isEmbedded = false }) {
  const [details, setDetails] = useState(emptyDetails);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [coreMemories, setCoreMemories] = useState([]); // {id, title, text, photos: [url,...]}
  const [newMemoryTitle, setNewMemoryTitle] = useState("");
  const [newMemoryText, setNewMemoryText] = useState("");

  const loadProfile = () => {
    setLoading(true);
    getMyProfile()
      .then((data) => setDetails({ ...emptyDetails, ...data.details }))
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
    getMyNotifications().then(setNotifications).catch(() => {});
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const field = (name) => ({
    value: details[name] || "",
    onChange: (e) => setDetails((d) => ({ ...d, [name]: e.target.value })),
  });

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    try {
      await uploadProfilePhoto(file);
      setMessage("Profile photo submitted for approval.");
      loadProfile();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleFeaturePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    try {
      await uploadFeaturePhoto(file);
      setMessage("Feature photo submitted for approval.");
      loadProfile();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      try {
        const res = await uploadGalleryPhoto(file, "");
        setGalleryPhotos((prev) => [...prev, { src: res.photo_url }]);
      } catch (e) {
        setMessage(e.message);
      }
    }
  };

  const handleCreateMemory = async () => {
    if (!newMemoryTitle.trim() && !newMemoryText.trim()) return;
    try {
      const res = await apiAddCoreMemory(newMemoryTitle.trim(), newMemoryText.trim());
      setCoreMemories((prev) => [...prev, { id: res.id, title: newMemoryTitle, text: newMemoryText, photos: [] }]);
      setNewMemoryTitle("");
      setNewMemoryText("");
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleAddMemoryPhoto = async (memoryId, event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      try {
        const res = await apiAddCoreMemoryPhoto(memoryId, file);
        setCoreMemories((prev) =>
          prev.map((m) => (m.id === memoryId ? { ...m, photos: [...m.photos, res.photo_url] } : m))
        );
      } catch (e) {
        setMessage(e.message);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!details.quote?.trim()) {
      setMessage("A quote is required before you can save your profile.");
      return;
    }
    if (!details.profile_photo_current && details.profile_photo_status !== "pending") {
      setMessage("A profile photo is required. Please upload one above.");
      return;
    }
    if (!details.feature_photo_current && details.feature_photo_status !== "pending") {
      setMessage("A feature photo is required. Please upload one above.");
      return;
    }

    try {
      await updateMyProfile({
        quote: details.quote,
        tagline: details.tagline,
        about: details.about,
        physics_like: details.physics_like,
        area_of_interest: details.area_of_interest,
        hobbies: details.hobbies,
        proud_of: details.proud_of,
        phd: details.phd,
        academic: details.academic,
        jobs: details.jobs,
        linkedin: details.linkedin,
        instagram: details.instagram,
        footer_quote: details.footer_quote,
      });
      if (onProfileUpdated) onProfileUpdated();
      setMessage("✓ Your yearbook profile has been saved.");
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage(e.message);
    }
  };

  if (loading) {
    return isEmbedded ? <p className="pw-hint">Loading...</p> : null;
  }

  const formContent = (
    <form className="profile-form" onSubmit={handleSubmit}>
      {/* Profile photo + basic info */}
      <section className="profile-section">
        <h3>Profile Photo (mandatory — shown on the home page)</h3>

        <div className="profile-main-details">
          <div className="profile-photo-upload">
            <div className="profile-photo-preview">
              {details.profile_photo_current || details.profile_photo_pending ? (
                <img
                  src={fileUrl(details.profile_photo_pending || details.profile_photo_current)}
                  alt="Profile preview"
                />
              ) : (
                <span>No Photo</span>
              )}
            </div>

            <label className="upload-button">
              Change Profile Photo
              <input type="file" accept="image/*" onChange={handleProfilePhotoChange} />
            </label>

            <PhotoStatusNote status={details.profile_photo_status} rejectReason={details.profile_photo_reject_reason} />
          </div>

          <div className="profile-user-info">
            <div className="form-group">
              <label>Roll Number</label>
              <input type="text" value={user.roll_no} readOnly />
            </div>

            <div className="form-group">
              <label>IITG Email</label>
              <input type="email" value={user.email} readOnly />
            </div>
          </div>
        </div>
      </section>

      {/* Feature photo */}
      <section className="profile-section">
        <h3>Feature Photo (mandatory — shown on your profile page)</h3>
        <div className="profile-photo-upload">
          <div className="profile-photo-preview">
            {details.feature_photo_current || details.feature_photo_pending ? (
              <img src={fileUrl(details.feature_photo_pending || details.feature_photo_current)} alt="Feature preview" />
            ) : (
              <span>No Photo</span>
            )}
          </div>
          <label className="upload-button">
            Change Feature Photo
            <input type="file" accept="image/*" onChange={handleFeaturePhotoChange} />
          </label>
          <PhotoStatusNote status={details.feature_photo_status} rejectReason={details.feature_photo_reject_reason} />
        </div>
      </section>

      {/* Short quote */}
      <section className="profile-section">
        <h3>Your Quote (mandatory)</h3>
        <div className="form-group">
          <label>A quote shown on your card and at the top of your profile</label>
          <input type="text" {...field("quote")} placeholder='e.g. "Give up on your dreams and die"' required />
        </div>
      </section>

      {/* Photo tagline */}
      <section className="profile-section">
        <h3>Photo Tagline</h3>
        <div className="form-group">
          <label>Short text shown beside your name under the main photo</label>
          <input type="text" {...field("tagline")} placeholder="e.g. curious mind, cosmic dreamer" maxLength={48} />
        </div>
      </section>

      {/* Fill-in-the-blank sentences */}
      <section className="profile-section">
        <h3>About You — fill in the blanks</h3>
        <p className="pw-hint">These appear as handwritten sentences on your public profile page.</p>

        <div className="form-group">
          <label>→ I like physics because…</label>
          <input type="text" {...field("physics_like")} placeholder="complete the sentence" />
        </div>
        <div className="form-group">
          <label>→ My area of interest is/are…</label>
          <input type="text" {...field("area_of_interest")} placeholder="complete the sentence" />
        </div>
        <div className="form-group">
          <label>→ Things I like to do apart from Physics are…</label>
          <input type="text" {...field("hobbies")} placeholder="complete the sentence" />
        </div>
        <div className="form-group">
          <label>→ One of the reasons I am proud of myself is…</label>
          <input type="text" {...field("proud_of")} placeholder="complete the sentence" />
        </div>
      </section>

      {/* Optional academic/career fields */}
      <section className="profile-section">
        <h3>Academic &amp; Career (optional)</h3>
        <div className="form-group">
          <label>PhD</label>
          <input type="text" {...field("phd")} placeholder="e.g. PhD in Condensed Matter, MIT" />
        </div>
        <div className="form-group">
          <label>Academic position</label>
          <input type="text" {...field("academic")} placeholder="e.g. Postdoc at CERN" />
        </div>
        <div className="form-group">
          <label>Job / role</label>
          <input type="text" {...field("jobs")} placeholder="e.g. Data Scientist at ..." />
        </div>
      </section>

      {/* Social links */}
      <section className="profile-section">
        <h3>Contact &amp; Social (optional)</h3>
        <div className="form-group">
          <label>LinkedIn URL</label>
          <input type="url" {...field("linkedin")} placeholder="https://linkedin.com/in/yourname" />
        </div>
        <div className="form-group">
          <label>Instagram Handle</label>
          <input type="text" {...field("instagram")} placeholder="@yourhandle" />
        </div>
      </section>

      {/* More About Me */}
      <section className="profile-section">
        <h3>More About Me</h3>
        <div className="form-group">
          <label>Write a longer introduction about yourself</label>
          <textarea {...field("about")} placeholder="Tell us something about yourself…" rows="6" />
        </div>
      </section>

      {/* Additional (gallery) photos */}
      <section className="profile-section">
        <h3>Additional Photos</h3>
        <p className="pw-hint">These are displayed in a carousel on your profile page.</p>

        <div className="additional-photo-grid">
          {galleryPhotos.map((photo, index) => (
            <div className="additional-photo-preview" key={`ap-${index}`}>
              <img src={fileUrl(photo.src)} alt={`Upload ${index + 1}`} />
            </div>
          ))}

          <label className="additional-upload-button">
            <span>+</span>
            <span>Add Photos</span>
            <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} />
          </label>
        </div>
      </section>

      {/* Core memories */}
      <section className="profile-section">
        <h3>Core Memories</h3>
        <p className="pw-hint">
          Share your most cherished memories from your time at IITG. Add as many as you like — each one
          can have its own photos.
        </p>

        {coreMemories.map((memory, index) => (
          <div key={memory.id} className="cm-entry">
            <div className="cm-entry-header">
              <span className="cm-entry-label">Core Memory #{index + 1}</span>
            </div>
            <p className="pw-hint">{memory.title}</p>
            <p className="pw-hint">{memory.text}</p>

            <div className="form-group">
              <label>Photos for this memory (optional)</label>
              <div className="additional-photo-grid">
                {(memory.photos || []).map((photo, pi) => (
                  <div className="additional-photo-preview" key={`cm-${memory.id}-${pi}`}>
                    <img src={fileUrl(photo)} alt={`Memory ${index + 1} photo ${pi + 1}`} />
                  </div>
                ))}
                <label className="additional-upload-button">
                  <span>+</span>
                  <span>Add</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleAddMemoryPhoto(memory.id, e)} />
                </label>
              </div>
            </div>
          </div>
        ))}

        <div className="form-group">
          <label>Title (optional)</label>
          <input
            type="text"
            value={newMemoryTitle}
            onChange={(e) => setNewMemoryTitle(e.target.value)}
            placeholder="e.g. The night we stargazed from the rooftop…"
          />
        </div>
        <div className="form-group">
          <label>Tell the story</label>
          <textarea
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            placeholder="What happened? How did it make you feel?"
            rows="4"
          />
        </div>
        <button type="button" className="cm-add-btn" onClick={handleCreateMemory}>
          + Add a Core Memory
        </button>
      </section>

      {/* Footer / closing quote */}
      <section className="profile-section">
        <h3>Closing Quote</h3>
        <div className="form-group">
          <label>A quote shown at the very bottom of your profile page</label>
          <input type="text" {...field("footer_quote")} placeholder='"We get humbled anyways."' />
        </div>
      </section>

      {/* Notifications (e.g. photo rejection reasons) */}
      <section className="profile-section profile-comments-section">
        <h3>Notifications</h3>
        {notifications.length > 0 ? (
          <div className="profile-comment-list">
            {notifications.map((n) => (
              <article className="profile-comment" key={n.id}>
                <p>{n.message}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-comments-empty">Approval updates and admin messages will appear here.</p>
        )}
      </section>

      <div className="profile-form-actions">
        <button type="submit" className="submit-profile-button">
          Save Profile
        </button>
        {message && <p className="profile-message">{message}</p>}
      </div>
    </form>
  );

  if (isEmbedded) {
    return formContent;
  }

  return (
    <div className="dashboard-overlay" onClick={onClose}>
      <div className="dashboard profile-workspace" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <button className="dashboard-back-button" onClick={onClose}>
            ← Back
          </button>

          <div className="dashboard-heading">
            <h2>My Profile</h2>
            <p>Manage your yearbook information</p>
          </div>

          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>

        <div className="dashboard-content">{formContent}</div>
      </div>
    </div>
  );
}

export default ProfileWorkspace;
