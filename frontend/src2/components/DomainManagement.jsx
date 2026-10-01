import { useEffect, useState } from "react";
import { listDomains, addDomain, removeDomain } from "../api/admin";

function DomainManagement() {
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    listDomains()
      .then(setDomains)
      .catch((e) => setMessage(e.message));
  };

  useEffect(load, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!newDomain.trim()) return;
    try {
      await addDomain(newDomain.trim());
      setNewDomain("");
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeDomain(id);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="user-management">
      <div className="management-title">
        <h3>Allowed Registration Email Domains</h3>
        <p>Only emails ending in one of these domains can register (e.g. iitg.ac.in).</p>
      </div>

      {message && <p className="auth-message">{message}</p>}

      <form onSubmit={handleAdd} className="position-assign" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="e.g. iitg.ac.in"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
        />
        <button type="submit" className="promote-button">
          Add Domain
        </button>
      </form>

      <div className="user-management-list">
        {domains.length === 0 ? (
          <p className="no-users">No domains configured yet — registration is currently blocked for everyone.</p>
        ) : (
          domains.map((d) => (
            <div className="managed-user" key={d.id}>
              <div className="managed-user-info">
                <h4>{d.domain}</h4>
              </div>
              <button className="demote-button" onClick={() => handleRemove(d.id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DomainManagement;
