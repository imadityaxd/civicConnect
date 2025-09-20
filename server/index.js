const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { nanoid } = require("nanoid");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" })); // allow base64 images

// In-memory stores (for prototype/demo)
const users = [];
// Issue object now includes department, proof, and gps
const issues = [];
/*
  {
    id,
    title,
    description,
    location,     // manual or landmark string
    gps: { lat, long }, // structured GPS coords
    photos: [base64],
    status,
    department,
    proof,
    createdAt,
    userId,
    username
  }
*/

// Helper: require simple auth via header "x-user"
function getUserFromHeader(req) {
  const username = req.header("x-user");
  if (!username) return null;
  let user = users.find((u) => u.username === username);
  if (!user) {
    user = { id: nanoid(), username };
    users.push(user);
  }
  return user;
}

// Register
app.post("/api/register", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });
  if (users.some((u) => u.username === username)) {
    return res.status(400).json({ error: "username exists" });
  }
  const user = { id: nanoid(), username };
  users.push(user);
  res.json({ ok: true, user });
});

// Login
app.post("/api/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username required" });
  let user = users.find((u) => u.username === username);
  if (!user) {
    user = { id: nanoid(), username };
    users.push(user);
  }
  res.json({ ok: true, user });
});

// Create issue (citizen)
app.post("/api/issues", (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "set header x-user" });

  const { title, description, location, gps, photos } = req.body;
  if (!title || !description || (!location && !gps)) {
    return res
      .status(400)
      .json({ error: "title, description and location or gps required" });
  }

  const issue = {
    id: nanoid(),
    title,
    description,
    location: location || null,
    gps: gps || null, // {lat, long}
    photos: photos || [],
    status: "Pending",
    department: null,
    proof: null,
    createdAt: new Date().toISOString(),
    userId: user.id,
    username: user.username,
  };
  issues.push(issue);
  res.json({ ok: true, issue });
});

// NEW --- Public endpoint for recent issues on the landing page
app.get("/api/issues/public", (req, res) => {
  const recentIssues = issues
    // Exclude rejected issues from the public view
    .filter(i => i.status !== "Rejected")
    // Sort by newest first
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    // Limit to the 6 most recent
    .slice(0, 6)
    // Return only public-safe fields
    .map(({ id, title, location, photos, status, createdAt }) => ({
      id,
      title,
      location,
      // Send only the first photo for the preview card
      photo: photos && photos.length > 0 ? photos[0] : null,
      status,
      createdAt,
    }));
  res.json({ ok: true, issues: recentIssues });
});
// Get issues
app.get("/api/issues", (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "set header x-user" });

  const isAdmin = user.username === "admin";
  const isDept = ["roads", "sanitation", "electricity"].includes(user.username);

  if (isAdmin) {
    return res.json({ ok: true, issues });
  } else if (isDept) {
    const deptIssues = issues.filter((i) => i.department === user.username);
    return res.json({ ok: true, issues: deptIssues });
  } else {
    const myIssues = issues.filter((i) => i.userId === user.id);
    return res.json({ ok: true, issues: myIssues });
  }
});

// Admin: update status
app.patch("/api/issues/:id/status", (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "set header x-user" });
  if (user.username !== "admin")
    return res.status(403).json({ error: "only admin can update status" });

  const id = req.params.id;
  const { status } = req.body;
  const issue = issues.find((i) => i.id === id);
  if (!issue) return res.status(404).json({ error: "not found" });
  if (!["Pending", "In Progress", "Resolved"].includes(status)) {
    return res.status(400).json({ error: "invalid status" });
  }
  issue.status = status;
  return res.json({ ok: true, issue });
});

// Admin: assign issue to department
app.patch("/api/issues/:id/assign", (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "set header x-user" });
  if (user.username !== "admin")
    return res.status(403).json({ error: "only admin can assign issues" });

  const id = req.params.id;
  const { department } = req.body;
  if (!["roads", "sanitation", "electricity"].includes(department)) {
    return res.status(400).json({ error: "invalid department" });
  }
  const issue = issues.find((i) => i.id === id);
  if (!issue) return res.status(404).json({ error: "not found" });

  issue.department = department;
  res.json({ ok: true, issue });
});

// Department: update status + add proof
app.put("/api/issues/:id", (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "set header x-user" });

  const isDept = ["roads", "sanitation", "electricity"].includes(user.username);
  if (!isDept)
    return res
      .status(403)
      .json({ error: "only department staff can update this" });

  const id = req.params.id;
  const { status, proof } = req.body;
  const issue = issues.find(
    (i) => i.id === id && i.department === user.username
  );
  if (!issue)
    return res
      .status(404)
      .json({ error: "not found or not assigned to your dept" });

  if (status && ["Pending", "In Progress", "Resolved"].includes(status)) {
    issue.status = status;
  }
  if (proof) {
    issue.proof = proof;
  }
  res.json({ ok: true, issue });
});

// Simple stats (admin only)
app.get("/api/stats", (req, res) => {
  const user = getUserFromHeader(req);
  if (!user) return res.status(401).json({ error: "set header x-user" });
  if (user.username !== "admin")
    return res.status(403).json({ error: "only admin" });

  const total = issues.length;
  const pending = issues.filter((i) => i.status === "Pending").length;
  const inProgress = issues.filter((i) => i.status === "In Progress").length;
  const resolved = issues.filter((i) => i.status === "Resolved").length;

  res.json({ ok: true, stats: { total, pending, inProgress, resolved } });
});

// Root
app.get("/", (req, res) => {
  res.send("Server connected successfully");
});

app.listen(PORT, () => {
  console.log(`Civic prototype server running on http://localhost:${PORT}`);
  console.log(
    'Use header "x-user: <username>" — "admin" for admin, "roads/sanitation/electricity" for departments.'
  );
});
