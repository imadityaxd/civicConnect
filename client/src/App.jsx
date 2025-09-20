import React, { useState } from "react";
import axios from "axios";
import AdminDashboard from "./components/AdminDashboard";
import ReportForm from "./components/ReportForm";
import MyIssues from "./components/MyIssues";
import Landing from "./components/Landing";
import DepartmentDashboard from "./components/DepartmentDashboard";

const API = "http://localhost:4000/api";

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState("home"); 
  const [dashboardView, setDashboardView] = useState(null); // for sub-dashboards

  async function handleLogin(username) {
    if (!username) return;
    await axios.post(`${API}/login`, { username });
    setUser({ username });

    if (username === "admin") {
      setDashboardView("admin");
      setView("dashboards");
    } else if (["roads", "sanitation", "electricity"].includes(username)) {
      setDashboardView("department");
      setView("dashboards");
    } else {
      setDashboardView("citizen");
      setView("dashboards");
    }
  }

  function logout() {
    setUser(null);
    setView("home");
    setDashboardView(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center py-4 px-6">
          <div>
            <h1 className="text-2xl font-bold">CivicConnect</h1>
            <p className="text-sm text-blue-100">
              Smart Civic Reporting • Citizens • Admin • Departments
            </p>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  Signed in as <b>{user.username}</b>
                </span>
                <button
                  className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Login onLogin={handleLogin} />
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {user && (
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto flex gap-4 px-6 py-2">
            <Tab label="Landing" active={view === "home"} onClick={() => setView("home")} />
            <Tab
              label="Report Issue"
              active={view === "report"}
              onClick={() => setView("report")}
              hidden={["admin", "roads", "sanitation", "electricity"].includes(user.username)}
            />
            <Tab
              label="Dashboards"
              active={view === "dashboards"}
              onClick={() => setView("dashboards")}
            />
          </div>
        </nav>
      )}

      {/* Sub-tabs for dashboards */}
      {view === "dashboards" && user && (
        <div className="bg-gray-50 border-b py-2">
          <div className="max-w-6xl mx-auto flex gap-3 px-6">
            {user.username === "admin" && (
              <Tab
                label="Admin Dashboard"
                active={dashboardView === "admin"}
                onClick={() => setDashboardView("admin")}
              />
            )}
            {["roads", "sanitation", "electricity"].includes(user.username) && (
              <Tab
                label="Department Dashboard"
                active={dashboardView === "department"}
                onClick={() => setDashboardView("department")}
              />
            )}
            {!["admin", "roads", "sanitation", "electricity"].includes(user.username) && (
              <Tab
                label="My Issues"
                active={dashboardView === "citizen"}
                onClick={() => setDashboardView("citizen")}
              />
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto w-full px-6 py-6">
        {view === "home" && <Landing />}
        {view === "report" && <ReportForm api={API} user={user} />}
        {view === "dashboards" && (
          <>
            {dashboardView === "citizen" && <MyIssues api={API} user={user} />}
            {dashboardView === "admin" && <AdminDashboard api={API} user={user} />}
            {dashboardView === "department" && (
              <DepartmentDashboard api={API} user={user} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 text-center text-sm text-gray-600">
        Demo prototype — Photos stored as base64 (demo only). Use{" "}
        <b>admin</b> for municipal view, or <b>roads / sanitation / electricity</b>{" "}
        for department dashboards.
      </footer>
    </div>
  );
}

// Reusable Tab Button
function Tab({ label, active, onClick, hidden }) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

// Login Component
// Login Component
function Login({ onLogin }) {
  const [name, setName] = useState("");

  async function handleSignup() {
    if (!name.trim()) return;
    try {
      await axios.post(`${API}/register`, { username: name.trim() });
      alert("Signup successful! You can now log in.");
    } catch (err) {
      alert(err?.response?.data?.error || "Signup failed");
    }
  }

  return (
    <div className="flex gap-2 items-center bg-white rounded-lg p-2 shadow-sm">
      <input
        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-700"
        placeholder="Enter username (eg. aditya, admin, roads)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
        onClick={() => onLogin(name.trim())}
      >
        Login
      </button>
      <button
        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
        onClick={handleSignup}
      >
        Signup
      </button>
    </div>
  );
}

