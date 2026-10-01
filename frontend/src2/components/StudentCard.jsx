function StudentCard({ student, onClick }) {
  return (
    <article className="student-card" onClick={() => onClick(student)}>
      <div className="photo-container">
        <img
          src={'http://localhost:8000'+ student.photo || "https://placehold.co/400x400"}
          alt={student.name}
          className="student-photo"
        />
      </div>

      <h3>{student.name}</h3>

      {student.rollNo && <p className="student-rollno">{student.rollNo}</p>}

      {student.positionTitle && (
        <span className="student-position-badge">{student.positionTitle}</span>
      )}

      <p className="student-quote">"{student.quote}"</p>
    </article>
  );
}

export default StudentCard;
