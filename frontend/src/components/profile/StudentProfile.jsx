import { useEffect, useState } from "react";
import { getStudentComments, addStudentComment, getStudentRollNo, formatSession, normalizeAdditionalPhoto } from "../../data/students";
import { getStudentDetail, listStudents } from "../../api/students";
import { normalizeStudentDetail } from "../../utils/student";
import { getBatchStatus } from "../../utils/batch";

function StudentProfile({
  studentId,
  currentUser,
  years = [],
  selectedYear,
  onClose,
  onSelectStudent,
  onSelectYear,
  onMyProfile,
}) {
  const [student, setStudent] = useState(null);
  const [yearStudents, setYearStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extraPhotoIndex, setExtraPhotoIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getStudentDetail(studentId)
      .then((detail) => {
        if (cancelled) return;
        const normalized = normalizeStudentDetail(detail);
        setStudent(normalized);
        setComments(getStudentComments(getStudentRollNo(normalized)));
        setCommentText("");
        setExtraPhotoIndex(0);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedYear) {
      setYearStudents([]);
      return undefined;
    }

    listStudents(selectedYear)
      .then((rows) => {
        if (!cancelled) {
          setYearStudents(rows.map((row) => ({
            id: row.user_id,
            name: row.name,
            rollNo: row.roll_no,
            year: row.batch_year,
          })));
        }
      })
      .catch(() => { if (!cancelled) setYearStudents([]); });

    return () => { cancelled = true; };
  }, [selectedYear, studentId]);

  const currentIndex = yearStudents.findIndex((item) => Number(item.id) === Number(studentId));
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < yearStudents.length - 1;

  const handlePrev = () => {
    if (canGoPrev) onSelectStudent(yearStudents[currentIndex - 1].id);
  };

  const handleNext = () => {
    if (canGoNext) onSelectStudent(yearStudents[currentIndex + 1].id);
  };

  const handlePrint = () => window.print();

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    if (!currentUser?.name?.trim() || !commentText.trim() || !student) return;

    const updatedComments = addStudentComment(getStudentRollNo(student), {
      name: currentUser.name,
      text: commentText,
    });
    setComments(updatedComments);
    setCommentText("");
  };

  if (loading) {
    return (
      <div className="sp-overlay" onClick={onClose}>
        <div className="sp-page" onClick={(event) => event.stopPropagation()}>
          <button className="sp-close" onClick={onClose} aria-label="Close profile">×</button>
          <div className="sp-content"><p className="auth-message">Loading student profile...</p></div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="sp-overlay" onClick={onClose}>
        <div className="sp-page" onClick={(event) => event.stopPropagation()}>
          <button className="sp-close" onClick={onClose} aria-label="Close profile">×</button>
          <div className="sp-content"><p className="auth-message">{error || "Student profile not found."}</p></div>
        </div>
      </div>
    );
  }

  const allExtraPhotos = (student.additionalPhotos || []).map(normalizeAdditionalPhoto);
  const currentExtraPhoto = allExtraPhotos[extraPhotoIndex];
  const rollNo = getStudentRollNo(student);
  const sessionText = formatSession(student.year || selectedYear);

  return (
    <div className="sp-overlay" onClick={onClose}>
      {/* ── Right sidebar navigation ── */}
      <nav className="sp-sidebar">
        <button
          className="sp-sidebar-btn"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          disabled={!canGoPrev}
          title="Previous student"
        >
          <span className="sp-sidebar-label">prev</span>
          <span className="sp-sidebar-icon">←</span>
        </button>

        <button
          className="sp-sidebar-btn"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          disabled={!canGoNext}
          title="Next student"
        >
          <span className="sp-sidebar-label">next</span>
          <span className="sp-sidebar-icon">→</span>
        </button>

        <button
          className="sp-sidebar-btn"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          title="Home"
        >
          <span className="sp-sidebar-label">home</span>
          <span className="sp-sidebar-icon">⌂</span>
        </button>

        <button
          className="sp-sidebar-btn"
          onClick={(e) => { e.stopPropagation(); onMyProfile(); }}
          title="My Profile"
        >
          <span className="sp-sidebar-label">my profile</span>
          <span className="sp-sidebar-icon">✎</span>
        </button>

        <button
          className="sp-sidebar-btn"
          onClick={(e) => { e.stopPropagation(); handlePrint(); }}
          title="Print or save as PDF"
        >
          <span className="sp-sidebar-label">print</span>
          <span className="sp-sidebar-icon">▣</span>
        </button>
      </nav>

      {/* ── Notebook page ── */}
      <div
        className="sp-page"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="sp-close"
          onClick={onClose}
          aria-label="Close profile"
        >
          ×
        </button>

        <div className="sp-content">
          {/* ── Top notebook header line & Date/Page metadata box ── */}
          <div className="sp-top-banner">
            <div className="sp-top-banner-info">
              <span className="sp-top-banner-title">
                M.Sc Physics, Batch {sessionText}
              </span>
              <span className="sp-top-banner-sub">
                IIT Guwahati
              </span>
            </div>

            {/* Notebook Date & Page No metadata box with dropdown selectors */}
            <div className="sp-meta-box">
              <div className="sp-meta-row">
                <span className="sp-meta-label">PAGE NO.</span>
                <span className="sp-meta-colon">:</span>
                <div className="sp-meta-value-container">
                  <select
                    className="sp-meta-select sp-session-select"
                    value={student.year || selectedYear || 2025}
                    onChange={(e) => {
                      const newYear = Number(e.target.value);
                      if (onSelectYear) {
                        onSelectYear(newYear);
                      }
                    }}
                    title="Change Session"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {formatSession(y)} — {getBatchStatus(y)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sp-meta-row">
                <span className="sp-meta-label">DATE</span>
                <span className="sp-meta-colon">:</span>
                <div className="sp-meta-value-container">
                  <select
                    className="sp-meta-select sp-roll-select"
                    value={student.id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (onSelectStudent) onSelectStudent(Number(selectedId));
                    }}
                    title="Select Student Roll No"
                  >
                    {yearStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getStudentRollNo(s)} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Heading section with Student Name ── */}
          <div className="sp-heading-section">
            <p className="sp-greeting">Hi… I am</p>
            <h1 className="sp-name">{student.name}</h1>
            {student.positionTitle && (
              <p className="sp-tagline" style={{ fontStyle: "normal" }}>
                {student.positionTitle}
              </p>
            )}
            {student.quote && (
              <p className="sp-tagline">
                &ldquo;{student.quote}&rdquo;
              </p>
            )}
          </div>

          {/* ── Heading whitespace spacing ── */}
          <div className="sp-heading-spacer"></div>

          {/* ── Attached printed photo & intro details ── */}
          <div className="sp-photo-showcase">
            <div className="sp-printed-photo-card">
              <div className="sp-tape-strip" aria-hidden="true"></div>
              <div className="sp-photo-frame">
                <img
                  src={student.photo}
                  alt={student.name}
                  className="sp-photo-img"
                />
              </div>
              <div className="sp-photo-caption">
                <span className="sp-photo-caption-tagline">
                  {student.tagline || "Yearbook profile"}
                </span>
                <span className="sp-photo-caption-name">{student.name}</span>
              </div>
            </div>

            <div className="sp-photo-info">
              {student.year && (
                <div className="sp-info-card">
                  <p className="sp-info-line">
                    <span className="sp-arrow">→</span>
                    <span className="sp-info-key">Session:</span>
                    <span className="sp-info-val">{sessionText}</span>
                  </p>
                  <p className="sp-info-line">
                    <span className="sp-arrow">→</span>
                    <span className="sp-info-key">Roll Number:</span>
                    <span className="sp-info-val">{rollNo}</span>
                  </p>
                  {student.email && (
                    <p className="sp-info-line">
                      <span className="sp-arrow">→</span>
                      <span className="sp-info-key">Email:</span>
                      <span className="sp-info-val">
                        <a href={`mailto:${student.email}`}>{student.email}</a>
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Fill-in-the-blank sentences ── */}
          {(student.physicsLike ||
            student.areaOfInterest ||
            student.hobbies ||
            student.proudOf) && (
            <div className="sp-fill-section">
              {student.physicsLike && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  I like physics because&nbsp;
                  <span className="sp-fill-answer">
                    {student.physicsLike}
                  </span>
                </p>
              )}
              {student.areaOfInterest && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  My area of interest is/are&nbsp;
                  <span className="sp-fill-answer">
                    {student.areaOfInterest}
                  </span>
                </p>
              )}
              {student.hobbies && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  Things I like to do apart from Physics are&nbsp;
                  <span className="sp-fill-answer">
                    {student.hobbies}
                  </span>
                </p>
              )}
              {student.proudOf && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  One of the reasons I am proud of myself is&nbsp;
                  <span className="sp-fill-answer">
                    {student.proudOf}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* ── Optional: PhD / academic / jobs ── */}
          {(student.phd || student.academic || student.jobs) && (
            <div className="sp-fill-section">
              {student.phd && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  PhD:&nbsp;
                  <span className="sp-fill-answer">{student.phd}</span>
                </p>
              )}
              {student.academic && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  Academic:&nbsp;
                  <span className="sp-fill-answer">{student.academic}</span>
                </p>
              )}
              {student.jobs && (
                <p className="sp-fill-line">
                  <span className="sp-arrow">→</span>
                  Current role:&nbsp;
                  <span className="sp-fill-answer">{student.jobs}</span>
                </p>
              )}
            </div>
          )}

          {/* ── Contact info ── */}
          {(student.email ||
            student.linkedin ||
            student.instagram) && (
            <div className="sp-contact">
              <p className="sp-section-label">
                <span className="sp-arrow">→</span> Feel free to reach
                me out on:
              </p>
              {student.email && (
                <p className="sp-contact-line">
                  <span className="sp-arrow sp-sub-arrow">→</span>{" "}
                  Email:{" "}
                  <a href={`mailto:${student.email}`}>
                    {student.email}
                  </a>
                </p>
              )}
              {student.linkedin && (
                <p className="sp-contact-line">
                  <span className="sp-arrow sp-sub-arrow">→</span>{" "}
                  LinkedIn:{" "}
                  <a
                    href={student.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {student.linkedin}
                  </a>
                </p>
              )}
              {student.instagram && (
                <p className="sp-contact-line">
                  <span className="sp-arrow sp-sub-arrow">→</span>{" "}
                  Instagram: {student.instagram}
                </p>
              )}
            </div>
          )}

          {/* ── More About Me + Extra photos side-by-side ── */}
          {(student.about || allExtraPhotos.length > 0) && (
            <div className="sp-about-row">
              {student.about && (
                <div className="sp-about">
                  <p className="sp-section-header">
                    <span className="sp-double-arrow">⇒</span> More
                    About Me:-
                  </p>
                  <div className="sp-about-text">{student.about}</div>
                </div>
              )}

              {allExtraPhotos.length > 0 && (
                <div className="sp-extra-photo">
                  <div className="sp-extra-photo-frame">
                    <img src={currentExtraPhoto.src} alt={currentExtraPhoto.caption || `Extra photo ${extraPhotoIndex + 1}`} />
                  </div>
                  <div className="sp-extra-photo-caption">
                    <span>{currentExtraPhoto.caption || student.tagline || "A memory to keep"}</span>
                    <strong>{student.name}</strong>
                  </div>
                  <div className="sp-extra-photo-nav">
                    <button
                      onClick={() =>
                        setExtraPhotoIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={extraPhotoIndex === 0}
                    >
                      &lt;
                    </button>
                    <span>
                      {extraPhotoIndex + 1} / {allExtraPhotos.length}
                    </span>
                    <button
                      onClick={() =>
                        setExtraPhotoIndex((i) =>
                          Math.min(allExtraPhotos.length - 1, i + 1)
                        )
                      }
                      disabled={
                        extraPhotoIndex === allExtraPhotos.length - 1
                      }
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Core Memories ── */}
          {(student.coreMemories || []).length > 0 && (
            <div className="sp-memories">
              {(student.coreMemories || []).map((memory, index) => (
                <div
                  key={memory.id ?? index}
                  className="sp-memory"
                >
                  <p className="sp-section-header">
                    <span className="sp-arrow">→</span> core memory I
                    want to share (#{index + 1}):-
                  </p>

                  {memory.title && (
                    <p className="sp-memory-title">{memory.title}</p>
                  )}

                  {memory.text && (
                    <div className="sp-memory-text">{memory.text}</div>
                  )}

                  {memory.photos && memory.photos.length > 0 && (
                    <div className="sp-memory-photos">
                      {memory.photos.map((photo, pi) => (
                        <div
                          key={pi}
                          className="sp-memory-photo-wrap"
                        >
                          <img
                            src={photo}
                            alt={`Memory ${index + 1} — photo ${
                              pi + 1
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Footer quote ── */}
          {(student.footerQuote || student.quote) && (
            <div className="sp-footer-quote">
              <p className="sp-footer-text">
                &ldquo;{student.footerQuote || student.quote}&rdquo;
              </p>
              <p className="sp-footer-attr">— {student.name}</p>
            </div>
          )}

          <section className="sp-comments" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="sp-section-header">
              <span className="sp-double-arrow">⇒</span> Comments
            </h2>
            {comments.length > 0 && (
              <div className="sp-comment-list">
                {comments.map((comment) => (
                  <article className="sp-comment" key={comment.id}>
                    <p className="sp-comment-text">{comment.text}</p>
                    <p className="sp-comment-author">— {comment.name}</p>
                  </article>
                ))}
              </div>
            )}
            {currentUser ? (
              <form className="sp-comment-form" onSubmit={handleCommentSubmit}>
                <label htmlFor="comment-text">Leave a comment</label>
                <textarea
                  id="comment-text"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Write something kind to remember"
                  maxLength={500}
                  rows={3}
                  required
                />
                <button type="submit">Add Comment</button>
              </form>
            ) : (
              <div className="sp-comment-login">
                <span>Log in to leave a comment.</span>
                <button type="button" onClick={onMyProfile}>
                  Log in
                </button>
              </div>
            )}
          </section>

          {/* ── Bottom navigation ── */}
          <div className="sp-bottom-nav">
            <button
              onClick={handlePrev}
              disabled={!canGoPrev}
            >
              prev.
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
            >
              next.
            </button>
            <button onClick={onClose}>back.</button>
            <button onClick={onClose}>home.</button>
          </div>

          {/* ── Footer note ── */}
          <div className="sp-page-footer-note">
            <p>
              Have queries ?? or perhaps, feedback ?? :{" "}
              <a href="mailto:best.team@iitg.ac.in">best.team@iitg.ac.in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;