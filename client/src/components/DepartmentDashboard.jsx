import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DepartmentDashboard({ api, user }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch assigned issues for this department
  async function fetchIssues() {
    try {
      const res = await axios.get(`${api}/issues`);
      // filter by department
      const deptIssues = res.data.filter(
        (issue) => issue.department === user.username
      );
      setIssues(deptIssues);
    } catch (err) {
      console.error("Error fetching issues", err);
    } finally {
      setLoading(false);
    }
  }

  // update status of an issue
  async function updateStatus(id, status, proof) {
    try {
      await axios.put(`${api}/issues/${id}`, { status, proof });
      fetchIssues();
    } catch (err) {
      console.error("Error updating issue", err);
    }
  }

  useEffect(() => {
    fetchIssues();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading issues...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-purple-600">
        {user.username.toUpperCase()} Department Dashboard
      </h2>

      {issues.length === 0 ? (
        <p className="text-gray-600">No issues assigned to this department.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {issues.map((issue) => (
            <div
              key={issue._id}
              className="bg-white p-4 rounded-xl shadow-md border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {issue.title}
              </h3>
              <p className="text-gray-600 mb-2">{issue.description}</p>
              <p className="text-sm text-gray-500 mb-2">
                <b>Location:</b> {issue.location || "Not specified"}
              </p>
              <p className="text-sm mb-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    issue.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : issue.status === "In Progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {issue.status}
                </span>
              </p>

              {issue.photo && (
                <img
                  src={issue.photo}
                  alt="issue"
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
              )}

              {/* Proof input */}
              <ProofForm
                issue={issue}
                onUpdate={(status, proof) =>
                  updateStatus(issue._id, status, proof)
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProofForm({ issue, onUpdate }) {
  const [proof, setProof] = useState("");

  return (
    <div className="space-y-2">
      <textarea
        placeholder="Add a note/proof of work..."
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        rows={2}
      />
      <div className="flex gap-2">
        {issue.status !== "In Progress" && (
          <button
            onClick={() => onUpdate("In Progress", proof)}
            className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            Mark In Progress
          </button>
        )}
        {issue.status !== "Resolved" && (
          <button
            onClick={() => onUpdate("Resolved", proof)}
            className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
          >
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  );
}
