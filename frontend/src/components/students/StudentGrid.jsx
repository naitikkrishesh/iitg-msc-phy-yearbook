import StudentCard from "./StudentCard";

function StudentGrid({ students, onStudentClick }) {
  return (
    <div className="student-grid">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onClick={onStudentClick}
        />
      ))}
    </div>
  );
}

export default StudentGrid;