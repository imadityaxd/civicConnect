import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Reusable Icon Components ---
const ArrowRightIcon = () => <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>;

// --- Data for static sections ---
const coreFeatures = [
    { title: "Seamless Reporting", description: "Effortless issue submission with photos and precise location data." },
    { title: "Real-time Transparency", description: "Citizens receive instant updates on the status of their reported issues." },
    { title: "Streamlined Administration", description: "Intuitive dashboards for efficient issue assignment and management." },
    { title: "Accountable Resolution", description: "Proof-based resolution ensures issues are demonstrably fixed." },
];

// --- Reusable UI Components ---
const SectionHeader = ({ subtitle, title, description }) => (
  <div className="text-center max-w-3xl mx-auto">
    <p className="text-blue-600 font-semibold text-sm uppercase tracking-wider">{subtitle}</p>
    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">{title}</h2>
    <p className="text-lg text-slate-600 mt-4 leading-relaxed">{description}</p>
  </div>
);

// NEW --- Status Badge Component for Issue Cards ---
const StatusBadge = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
  let specificClasses = "";
  switch (status?.toLowerCase()) {
    case "resolved": specificClasses = "bg-green-100 text-green-800"; break;
    case "in progress": specificClasses = "bg-blue-100 text-blue-800"; break;
    default: specificClasses = "bg-yellow-100 text-yellow-800"; break;
  }
  return <span className={`${baseClasses} ${specificClasses}`}>{status}</span>;
};

// NEW --- Issue Card Component ---
const IssueCard = ({ issue }) => (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden group transition-shadow hover:shadow-xl">
        <div className="h-48 bg-slate-200">
            {issue.photo ? (
                <img src={issue.photo} alt={issue.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No Photo</div>
            )}
        </div>
        <div className="p-5">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 pr-2">{issue.title}</h3>
                <StatusBadge status={issue.status} />
            </div>
            <p className="text-sm text-slate-500 mb-1">{issue.location}</p>
            <p className="text-xs text-slate-400">
                Reported on {new Date(issue.createdAt).toLocaleDateString()}
            </p>
        </div>
    </div>
);

// --- Main Landing Page Component ---
export default function Landing() {
  // NEW --- State for fetching and storing recent issues ---
  const [recentIssues, setRecentIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // NEW --- useEffect to fetch issues on component mount ---
  useEffect(() => {
    const fetchRecentIssues = async () => {
      try {
        // Assuming your API is running on localhost:4000
        const response = await axios.get('http://localhost:4000/api/issues/public');
        setRecentIssues(response.data.issues || []);
      } catch (error) {
        console.error("Failed to fetch recent issues:", error);
      } finally {
        setLoadingIssues(false);
      }
    };
    fetchRecentIssues();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-24 md:py-32">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/path/to/cityscape-bg.jpg')" }}></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Empowering Communities, Resolving Issues
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-10">
            A citizen-driven platform for transparent civic infrastructure management.
          </p>
          <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center mx-auto">
            Get Started <ArrowRightIcon />
          </button>
        </div>
      </section>

      {/* NEW --- Recent Issues Section --- */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            subtitle="Live Reports"
            title="See Our Community in Action"
            description="Here are some of the latest issues reported by citizens. Track their progress from pending to resolved."
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            {loadingIssues ? (
              <p className="text-slate-500 col-span-full text-center">Loading recent issues...</p>
            ) : (
              recentIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)
            )}
            {!loadingIssues && recentIssues.length === 0 && (
                <p className="text-slate-500 col-span-full text-center">No issues have been reported yet.</p>
            )}
          </div>
        </div>
      </section>
      
      {/* Core Features Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
            <SectionHeader
                subtitle="Core Features"
                title="Designed for Efficiency and Trust"
                description="Every feature is built to foster better communication and deliver faster, more accountable results."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
                {coreFeatures.map((feature, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                        <p className="text-slate-600">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm">
          <p>&copy; Smart India Hackathon {new Date().getFullYear()} </p>
        </div>
      </footer>
    </div>
  );
}