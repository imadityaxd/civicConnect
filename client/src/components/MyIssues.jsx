import React, { useState, useEffect } from "react";
import axios from "axios";

// Helper component for visually distinct status badges
const StatusBadge = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
  let specificClasses = "";

  switch (status.toLowerCase()) {
    case "resolved":
      specificClasses = "bg-green-100 text-green-800";
      break;
    case "in progress":
      specificClasses = "bg-blue-100 text-blue-800";
      break;
    case "pending":
    default:
      specificClasses = "bg-yellow-100 text-yellow-800";
      break;
  }

  return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};


export default function MyIssues({ api, user }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchIssues() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.get(`${api}/issues?mine=true`, {
        headers: { "x-user": user.username },
      });
      setIssues(resp.data.issues || []);
    } catch (err) {
      console.error(err);
      // Optionally set an error state here to show in the UI
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIssues();
  }, [user]);

  // --- Login Prompt ---
  if (!user) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold text-gray-700">Please log in to view your reported issues.</h3>
      </div>
    );
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-gray-600">Loading your issues...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg">
      
      {/* --- Header --- */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">My Reported Issues</h2>
        <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">{issues.length}</span>
      </div>

      {/* --- No Issues State --- */}
      {issues.length === 0 && (
        <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
          
          <h3 className="text-xl font-semibold text-gray-700 mt-4">No Issues Reported Yet</h3>
          <p className="text-gray-500 mt-2">Ready to make a difference? Report your first issue today!</p>
          <button className="mt-4 bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors">
            Report an Issue
          </button>
        </div>
      )}

      {/* --- Issues List --- */}
      <div className="space-y-6">
        {issues.map((issue) => (
          <div key={issue.id} className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-gray-50 p-4 rounded-xl border hover:shadow-md transition-shadow">
            
            {/* --- Photo Column --- */}
            <div className="md:col-span-1">
              {issue.photos && issue.photos.length > 0 ? (
                <img src={issue.photos[0]} alt={issue.title} className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
            </div>

            {/* --- Details Column --- */}
            <div className="md:col-span-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 mb-1 sm:mb-0">{issue.title}</h3>
                <StatusBadge status={issue.status} />
              </div>

              <p className="text-gray-600 text-sm mb-4">{issue.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span>{issue.location}</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span>Submitted: {new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}