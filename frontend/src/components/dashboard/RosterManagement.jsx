import { useEffect, useState } from "react";
import { listRoster, addStudentManual, importStudentsExcel } from "../../api/admin";

function RosterManagement() {
  const [roster, setRoster] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ batchYear: "", name: "", rollNo: "", iitgEmail: "" });
  const [importResult, setImportResult] = useState(null);

  const load = () => {
    listRoster()
      .then(setRoster)
      .catch((e) => setMessage(e.message));
  };

  useEffect(load, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await addStudentManual({
        batchYear: Number(form.batchYear),
        name: form.name.trim(),
        rollNo: form.rollNo.trim(),
        iitgEmail: form.iitgEmail.trim(),
      });
      setForm({ batchYear: "", name: "", rollNo: "", iitgEmail: "" });
      setMessage("Student added to roster.");
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    setImportResult(null);
    try {
      const result = await importStudentsExcel(file);
      setImportResult(result);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="user-management">
      <div className="management-title">
        <h3>Student Roster</h3>
        <p>Add students one by one, or bulk-import from an excel file (columns: batch_year, name, roll_no, iitg_email).</p>
      </div>

      {message && <p className="auth-message">{message}</p>}

      <form className="profile-form" onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <div className="profile-main-details" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="form-group">
            <label>Batch Year</label>
            <input
              type="number"
              value={form.batchYear}
              onChange={(e) => setForm((f) => ({ ...f, batchYear: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Roll Number</label>
            <input
              type="text"
              value={form.rollNo}
              onChange={(e) => setForm((f) => ({ ...f, rollNo: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>IITG Email</label>
            <input
              type="email"
              value={form.iitgEmail}
              onChange={(e) => setForm((f) => ({ ...f, iitgEmail: e.target.value }))}
              required
            />
          </div>
        </div>
        <button type="submit" className="submit-profile-button">
          Add Student
        </button>
      </form>

      <label className="upload-button" style={{ display: "inline-block", marginBottom: 16 }}>
        Upload Excel File
        <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ display: "none" }} />
      </label>

      {importResult && (
        <p className="pw-hint">
          Imported {importResult.success} of {importResult.total} rows
          {importResult.failed > 0 ? ` (${importResult.failed} failed — see console for details)` : ""}.
        </p>
      )}

      <div className="user-management-list">
        {roster.length === 0 ? (
          <p className="no-users">No students on the roster yet.</p>
        ) : (
          roster.map((s) => (
            <div className="managed-user" key={s.id}>
              <div className="managed-user-info">
                <div>
                  <h4>{s.name}</h4>
                  <p>{s.roll_no} · Batch {s.batch_year} · {s.iitg_email}</p>
                  <span className={`role-badge ${s.is_registered ? "admin" : "user"}`}>
                    {s.is_registered ? "Registered" : "Not registered"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RosterManagement;
