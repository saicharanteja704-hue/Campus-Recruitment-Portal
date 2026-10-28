
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Student = require("./models/Student");
const Application = require("./models/Applications");
const Job = require("./models/Job");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// -------------------- SAMPLE JOBS --------------------

const sampleJobs = [
  {
    id: "JOB001",
    company: "TCS",
    role: "Graduate Trainee",
    location: "Hyderabad",
    salary: "3.6 LPA",
    minCGPA: 6.0,
    skills: ["Java", "SQL", "Problem Solving"],
    description: "Entry-level graduate trainee opportunity.",
    status: "Open",
  },
  {
    id: "JOB002",
    company: "Infosys",
    role: "Systems Engineer",
    location: "Bengaluru",
    salary: "4 LPA",
    minCGPA: 6.5,
    skills: ["Python", "SQL", "Communication"],
    description: "Entry-level systems engineering opportunity.",
    status: "Open",
  },
  {
    id: "JOB003",
    company: "Accenture",
    role: "Associate Software Engineer",
    location: "Hyderabad",
    salary: "4.5 LPA",
    minCGPA: 6.0,
    skills: ["JavaScript", "React", "Problem Solving"],
    description: "Entry-level software engineering opportunity.",
    status: "Open",
  },
];

// -------------------- AUTHENTICATION --------------------

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please log in.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token. Please log in again.",
      });
    }

    req.user = decoded;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

// -------------------- BASIC ROUTES --------------------

app.get("/", (req, res) => {
  res.send("Campus Recruitment Portal API is running.");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Campus Recruitment Portal backend is healthy.",
  });
});

// -------------------- REGISTER --------------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      branch,
      cgpa,
      graduationYear,
      role = "student",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    if (!["student", "recruiter"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingStudent = await Student.findOne({
      email: normalizedEmail,
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const studentData = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    };

    if (branch !== undefined) {
      studentData.branch = branch;
    }

    if (cgpa !== undefined && cgpa !== "") {
      const parsedCGPA = Number(cgpa);

      if (!Number.isFinite(parsedCGPA) || parsedCGPA < 0 || parsedCGPA > 10) {
        return res.status(400).json({
          message: "CGPA must be between 0 and 10.",
        });
      }

      studentData.cgpa = parsedCGPA;
    }

    if (graduationYear !== undefined && graduationYear !== "") {
      const parsedYear = Number(graduationYear);

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 2000 ||
        parsedYear > 2100
      ) {
        return res.status(400).json({
          message: "Please enter a valid graduation year.",
        });
      }

      studentData.graduationYear = parsedYear;
    }

    const student = await Student.create(studentData);

    return res.status(201).json({
      message: "Registration successful.",
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        branch: student.branch,
        cgpa: student.cgpa,
        graduationYear: student.graduationYear,
        role: student.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed.",
    });
  }
});

// -------------------- LOGIN --------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const student = await Student.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      student.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: student._id.toString(),
        email: student.email,
        role: student.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      student: {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        branch: student.branch,
        cgpa: student.cgpa,
        graduationYear: student.graduationYear,
        role: student.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});

// -------------------- CURRENT USER --------------------

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-passwordHash");

    if (!student) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({ student });
  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      message: "Could not retrieve user details.",
    });
  }
});

// -------------------- GET OPEN JOBS --------------------

app.get("/api/jobs", async (req, res) => {
  try {
    const databaseJobs = await Job.find({ status: "Open" })
      .sort({ createdAt: -1 })
      .lean();

    const formattedDatabaseJobs = databaseJobs.map((job) => ({
      ...job,
      id: job._id.toString(),
    }));

    return res.json([...formattedDatabaseJobs, ...sampleJobs]);
  } catch (error) {
    console.error("Fetch jobs error:", error);

    return res.status(500).json({
      message: "Could not fetch jobs.",
    });
  }
});

// -------------------- GET ONE JOB --------------------

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sampleJob = sampleJobs.find((job) => job.id === id);

    if (sampleJob) {
      return res.json(sampleJob);
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    const job = await Job.findById(id).lean();

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
      });
    }

    return res.json({
      ...job,
      id: job._id.toString(),
    });
  } catch (error) {
    console.error("Fetch job error:", error);

    return res.status(500).json({
      message: "Could not fetch job details.",
    });
  }
});

// -------------------- RECRUITER: CREATE JOB --------------------

app.post(
  "/api/jobs",
  authenticateToken,
  authorizeRoles("recruiter"),
  async (req, res) => {
    try {
      const {
        company,
        role,
        location,
        salary,
        minCGPA,
        skills,
        description,
      } = req.body;

      if (
        !company?.trim() ||
        !role?.trim() ||
        !location?.trim() ||
        !salary?.toString().trim() ||
        minCGPA === undefined ||
        minCGPA === null ||
        minCGPA === ""
      ) {
        return res.status(400).json({
          message:
            "Company, role, location, salary, and minimum CGPA are required.",
        });
      }

      const parsedCGPA = Number(minCGPA);

      if (
        !Number.isFinite(parsedCGPA) ||
        parsedCGPA < 0 ||
        parsedCGPA > 10
      ) {
        return res.status(400).json({
          message: "Minimum CGPA must be between 0 and 10.",
        });
      }

      let skillsArray = [];

      if (Array.isArray(skills)) {
        skillsArray = skills;
      } else if (typeof skills === "string" && skills.trim()) {
        skillsArray = skills.split(",");
      }

      skillsArray = skillsArray
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const job = await Job.create({
        company: company.trim(),
        role: role.trim(),
        location: location.trim(),
        salary: salary.toString().trim(),
        minCGPA: parsedCGPA,
        skills: skillsArray,
        description:
          typeof description === "string" ? description.trim() : "",
        recruiterId: req.user.id,
        status: "Open",
      });

      return res.status(201).json({
        message: "Job posted successfully.",
        job: {
          ...job.toObject(),
          id: job._id.toString(),
        },
      });
    } catch (error) {
      console.error("Create job error:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Could not create job.",
      });
    }
  }
);

// -------------------- RECRUITER: CLOSE JOB --------------------

app.patch(
  "/api/jobs/:id/close",
  authenticateToken,
  authorizeRoles("recruiter"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid job ID.",
        });
      }

      const job = await Job.findById(id);

      if (!job) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      // Verify ownership before changing the job.
      if (String(job.recruiterId) !== String(req.user.id)) {
        return res.status(403).json({
          message: "You can only close your own jobs.",
        });
      }

      if (job.status === "Closed") {
        return res.status(400).json({
          message: "This job is already closed.",
        });
      }

      job.status = "Closed";
      await job.save();

      return res.json({
        message: "Job closed successfully.",
        job: {
          ...job.toObject(),
          id: job._id.toString(),
        },
      });
    } catch (error) {
      console.error("Close job error:", error);

      return res.status(500).json({
        message: "Unable to close the job.",
      });
    }
  }
);

// -------------------- STUDENT: APPLY FOR A JOB --------------------

app.post(
  "/api/applications",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { jobId } = req.body;

      if (!jobId) {
        return res.status(400).json({
          message: "Job ID is required.",
        });
      }

      const student = await Student.findById(req.user.id);

      if (!student) {
        return res.status(404).json({
          message: "Student account not found.",
        });
      }

      let selectedJob = sampleJobs.find(
        (job) => job.id === String(jobId)
      );

      if (!selectedJob && mongoose.isValidObjectId(jobId)) {
        const databaseJob = await Job.findById(jobId).lean();

        if (databaseJob) {
          selectedJob = {
            id: databaseJob._id.toString(),
            company: databaseJob.company,
            role: databaseJob.role,
            minCGPA: databaseJob.minCGPA,
            status: databaseJob.status,
          };
        }
      }

      if (!selectedJob) {
        return res.status(404).json({
          message: "Job not found.",
        });
      }

      if (selectedJob.status !== "Open") {
        return res.status(400).json({
          message: "This job is closed and no longer accepting applications.",
        });
      }

      if (
        Number.isFinite(Number(student.cgpa)) &&
        Number(student.cgpa) < Number(selectedJob.minCGPA)
      ) {
        return res.status(400).json({
          message: `Your CGPA does not meet the minimum requirement of ${selectedJob.minCGPA}.`,
        });
      }

      const existingApplication = await Application.findOne({
        studentEmail: student.email,
        jobId: selectedJob.id,
      });

      if (existingApplication) {
        return res.status(409).json({
          message: "You have already applied for this job.",
        });
      }

      const application = await Application.create({
        studentName: student.name,
        studentEmail: student.email,
        jobId: selectedJob.id,
        company: selectedJob.company,
        role: selectedJob.role,
        status: "Submitted",
      });

      return res.status(201).json({
        message: "Application submitted successfully.",
        application,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "You have already applied for this job.",
        });
      }

      console.error("Apply for job error:", error);

      return res.status(500).json({
        message: "Could not submit your application.",
      });
    }
  }
);

// -------------------- STUDENT: VIEW MY APPLICATIONS --------------------

app.get(
  "/api/applications",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const student = await Student.findById(req.user.id);

      if (!student) {
        return res.status(404).json({
          message: "Student account not found.",
        });
      }

      const applications = await Application.find({
        studentEmail: student.email,
      }).sort({ createdAt: -1 });

      return res.json(applications);
    } catch (error) {
      console.error("Fetch applications error:", error);

      return res.status(500).json({
        message: "Could not fetch your applications.",
      });
    }
  }
);

// -------------------- RECRUITER DASHBOARD --------------------

app.get(
  "/api/recruiter/dashboard",
  authenticateToken,
  authorizeRoles("recruiter"),
  async (req, res) => {
    try {
      const jobsPosted = await Job.countDocuments({
        recruiterId: req.user.id,
      });

      return res.json({
        message: "Welcome to the recruiter dashboard.",
        recruiter: {
          id: req.user.id,
          email: req.user.email,
        },
        jobsPosted,
        features: [
          "Post new jobs",
          "Manage job listings",
          "Review student applications",
        ],
      });
    } catch (error) {
      console.error("Recruiter dashboard error:", error);

      return res.status(500).json({
        message: "Could not load recruiter dashboard.",
      });
    }
  }
);

// -------------------- RECRUITER: VIEW APPLICANTS --------------------

app.get(
  "/api/recruiter/applications",
  authenticateToken,
  authorizeRoles("recruiter"),
  async (req, res) => {
    try {
      const jobs = await Job.find({
        recruiterId: req.user.id,
      });

      const jobIds = jobs.map((job) => String(job._id));

      const applications = await Application.find({
        jobId: { $in: jobIds },
      }).sort({ createdAt: -1 });

      const result = applications.map((application) => {
        const job = jobs.find(
          (item) => String(item._id) === String(application.jobId)
        );

        return {
          ...application.toObject(),
          company: job?.company || application.company,
          role: job?.role || application.role,
        };
      });

      return res.json(result);
    } catch (error) {
      console.error("Fetch recruiter applications error:", error);

      return res.status(500).json({
        message: "Failed to fetch recruiter applications.",
      });
    }
  }
);

// -------------------- RECRUITER: UPDATE APPLICATION STATUS --------------------

app.patch(
  "/api/recruiter/applications/:id/status",
  authenticateToken,
  authorizeRoles("recruiter"),
  async (req, res) => {
    try {
      const { status } = req.body;

      const allowedStatuses = [
        "Under Review",
        "Shortlisted",
        "Rejected",
        "Selected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid application status.",
        });
      }

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          message: "Invalid application ID.",
        });
      }

      const application = await Application.findById(req.params.id);

      if (!application) {
        return res.status(404).json({
          message: "Application not found.",
        });
      }

      const jobs = await Job.find({
        recruiterId: req.user.id,
      });

      const recruiterOwnsJob = jobs.some(
        (job) => String(job._id) === String(application.jobId)
      );

      if (!recruiterOwnsJob) {
        return res.status(403).json({
          message: "You cannot update applications for this job.",
        });
      }

      application.status = status;
      await application.save();

      return res.json({
        message: "Application status updated successfully.",
        application,
      });
    } catch (error) {
      console.error("Update application status error:", error);

      return res.status(500).json({
        message: "Failed to update application status.",
      });
    }
  }
);

// -------------------- START SERVER --------------------

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from backend/.env");
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_SECRET must be set in backend/.env and contain at least 32 characters."
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();
