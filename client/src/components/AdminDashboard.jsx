import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale);

export default function AdminDashboard({ api, user }) {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef();

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    if (!user || user.username !== "admin") return;
    setLoading(true);
    try {
      const issuesResp = await axios.get(`${api}/issues`, {
        headers: { "x-user": user.username },
      });
      setIssues(issuesResp.data.issues || []);
      const statsResp = await axios.get(`${api}/stats`, {
        headers: { "x-user": user.username },
      });
      setStats(statsResp.data.stats);
      drawChart(statsResp.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function drawChart(s) {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext("2d");
    if (chartRef.current._chart) chartRef.current._chart.destroy();
    chartRef.current._chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Pending", "In Progress", "Resolved"],
        datasets: [
          {
            label: "Issues",
            data: [s.pending, s.inProgress, s.resolved],
            backgroundColor: ["#fbbf24", "#3b82f6", "#22c55e"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  async function changeStatus(id, status) {
    try {
      await axios.patch(
        `${api}/issues/${id}/status`,
        { status },
        { headers: { "x-user": user.username } }
      );
      await fetchAll();
    } catch (err) {
      alert(err?.response?.data?.error || "error");
    }
  }

  // New function to handle rejection with optimistic UI update
  async function handleReject(issueId) {
    // Keep a copy of the original issues list in case of an error
    const originalIssues = [...issues];

    // Optimistically remove the issue from the UI for a faster feel
    setIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId));

    try {
      // Send the "Rejected" status to the backend
      await axios.patch(
        `${api}/issues/${issueId}/status`,
        { status: "Rejected" },
        { headers: { "x-user": user.username } }
      );
      // On success, refetch the stats to keep the dashboard chart accurate
      const statsResp = await axios.get(`${api}/stats`, { headers: { "x-user": user.username } });
      setStats(statsResp.data.stats);
      drawChart(statsResp.data.stats);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to reject the issue.");
      // If the API call fails, revert the UI change
      setIssues(originalIssues);
    }
  }

  async function assignDepartment(id, department) {
    try {
      await axios.patch(
        `${api}/issues/${id}/assign`,
        { department },
        { headers: { "x-user": user.username } }
      );
      await fetchAll();
    } catch (err) {
      alert("Error assigning department");
    }
  }

  if (!user || user.username !== "admin")
    return (
      <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
        Admin only. Login with username <b>admin</b>.
      </div>
    );

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Issues List */}
      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">
            Admin — All Issues
          </h3>
          {loading && <div className="text-gray-500">Loading...</div>}
          <div className="space-y-4">
            {issues.map((i) => (
              <div
                key={i.id}
                className="border rounded-lg p-4 shadow-sm bg-gray-50"
              >
                <div className="flex justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{i.title}</h4>
                    <p className="text-sm text-gray-600">{i.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Reported by: <b>{i.username}</b> • Location: {i.location}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          i.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : i.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {i.status}
                      </span>
                      {i.department && (
                        <span className="text-xs text-purple-600">
                          Dept: {i.department}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => changeStatus(i.id, "In Progress")}
                        className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => changeStatus(i.id, "Resolved")}
                        className="px-3 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
                      >
                        Mark Resolved
                      </button>
                      {/* UPDATED BUTTON */}
                      <button
                        onClick={() => handleReject(i.id)}
                        className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>

                    {/* Department Assignment */}
                    <div className="mt-3">
                      <label className="text-xs text-gray-600">
                        Assign to Department:
                      </label>
                      <select
                        className="ml-2 px-2 py-1 border rounded-md text-sm"
                        value={i.department || ""}
                        onChange={(e) =>
                          assignDepartment(i.id, e.target.value)
                        }
                      >
                        <option value="">-- Select --</option>
                        <option value="roads">Roads</option>
                        <option value="sanitation">Sanitation</option>
                        <option value="electricity">Electricity</option>
                      </select>
                    </div>
                  </div>

                  {i.photos && i.photos.length > 0 && (
                    <img
                      src={i.photos[0]}
                      alt="issue"
                      className="w-28 h-28 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="text-lg font-semibold text-indigo-600 mb-3">Stats</h4>
          {!stats && <div className="text-gray-500">No stats available</div>}
          {stats && (
            <div>
              <p className="text-sm text-gray-600">Total: {stats.total}</p>
              <p className="text-sm text-gray-600">Pending: {stats.pending}</p>
              <p className="text-sm text-gray-600">
                In Progress: {stats.inProgress}
              </p>
              <p className="text-sm text-gray-600">
                Resolved: {stats.resolved}
              </p>
              <div className="h-48 mt-4">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-700 shadow-sm">
          <b>Demo Admin Tips:</b>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Assign issues to departments (roads/sanitation/electricity).</li>
            <li>
              Use buttons to simulate resolving issues and track updates.
            </li>
            <li>
              Open "My Issues" as a citizen to demonstrate real-time updates.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}