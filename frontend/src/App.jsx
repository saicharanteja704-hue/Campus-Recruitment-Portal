
import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

const EMPTY_JOB = {
  company: "",
  role: "",
  location: "",
  salary: "",
  minCGPA: "6.0",
  skills: "",
  description: "",
};

const SAMPLE_JOBS = [
  {
    id: "JOB001",
    company: "TCS",
    role: "Graduate Trainee",
    location: "Hyderabad",
    salary: "3.6 LPA",
    minCGPA: 6,
    skills: ["Java", "SQL", "Problem Solving"],
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
    status: "Open",
  },
  {
    id: "JOB003",
    company: "Accenture",
    role: "Associate Software Engineer",
    location: "Hyderabad",
    salary: "4.5 LPA",
    minCGPA: 6,
    skills: ["JavaScript", "React", "Problem Solving"],
    status: "Open",
  },
];

const STATUSES = [
  "Under Review",
  "Shortlisted",
  "Rejected",
  "Selected",
];

function readSession() {
  try {
    return {
      token: sessionStorage.getItem("token") || "",
      student: JSON.parse(sessionStorage.getItem("student") || "null"),
    };
  } catch {
    return { token: "", student: null };
  }
}

async function apiRequest(path, options = {}, token = "") {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Unexpected server response." };
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}.`
    );
  }

  return data;
}

function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
}) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  min,
  max,
  step,
  rows,
}) {
  const classes =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {rows ? (
        <textarea
          className={classes}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          className={classes}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          required={required}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
      )}
    </label>
  );
}

function Badge({ children, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[color] || colors.indigo}`}
    >
      {children}
    </span>
  );
}

function Notice({ notice, onClose }) {
  if (!notice) return null;

  return (
    <div
      className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span>{notice.message}</span>
      <button onClick={onClose} type="button" className="font-bold">
        ×
      </button>
    </div>
  );
}

function JobCard({
  job,
  onApply,
  applying,
  applied,
  recruiter = false,
  onClose,
}) {
  const skills = Array.isArray(job.skills) ? job.skills : [];

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{job.role}</h3>
          <p className="mt-1 text-sm text-slate-500">{job.company}</p>
        </div>
        <Badge color={job.status === "Closed" ? "red" : "green"}>
          {job.status || "Open"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
        <p>📍 {job.location || "Not specified"}</p>
        <p>💰 {job.salary || "Not specified"}</p>
        <p>🎓 Minimum CGPA: {job.minCGPA ?? "N/A"}</p>
      </div>

      {job.description && (
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {job.description}
        </p>
      )}

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <Badge key={`${skill}-${i}`} color="gray">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {onApply && (
        <div className="mt-5">
          <Button
            onClick={() => onApply(job)}
            disabled={applying || applied || job.status === "Closed"}
          >
            {applying ? "Applying..." : applied ? "Applied ✓" : "Apply Now"}
          </Button>
        </div>
      )}

      {recruiter && onClose && job.status !== "Closed" && (
        <div className="mt-5">
          <Button variant="secondary" onClick={() => onClose(job)}>
            Close Job
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function App() {
  const [session, setSession] = useState(readSession);
  const [authMode, setAuthMode] = useState("login");
  const [authRole, setAuthRole] = useState("student");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    branch: "CSE - Data Science",
    cgpa: "8.83",
    graduationYear: "2029",
  });

  const [page, setPage] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [recruiterApplications, setRecruiterApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState("");
  const [updatingApplicationId, setUpdatingApplicationId] = useState("");
  const [notice, setNotice] = useState(null);

  const token = session.token;
  const student = session.student;
  const role = student?.role || "student";
  const isLoggedIn = Boolean(token && student);
  const isRecruiter = role === "recruiter";

  const notify = (message, type = "success") =>
    setNotice({ message, type });

  const changePage = (nextPage) => {
    setPage(nextPage);
    setNotice(null);
  };

  const loadJobs = useCallback(async () => {
    try {
      const data = await apiRequest("/api/jobs");
      const serverJobs = Array.isArray(data) ? data : data.jobs || [];
      const ids = new Set(serverJobs.map((job) => String(job.id || job._id)));

      setJobs([
        ...serverJobs,
        ...SAMPLE_JOBS.filter((job) => !ids.has(String(job.id))),
      ]);
    } catch (error) {
      setJobs(SAMPLE_JOBS);
      notify(`Using sample jobs. ${error.message}`, "error");
    }
  }, []);

  const loadApplications = useCallback(async () => {
    if (!token || isRecruiter) return;

    try {
      const data = await apiRequest("/api/applications", {}, token);
      setApplications(Array.isArray(data) ? data : data.applications || []);
    } catch (error) {
      notify(error.message, "error");
    }
  }, [token, isRecruiter]);

  const loadRecruiterApplications = useCallback(async () => {
    if (!token || !isRecruiter) return;

    try {
      const data = await apiRequest(
        "/api/recruiter/applications",
        {},
        token
      );
      const items = Array.isArray(data)
        ? data
        : data.applications || data.results || [];

      setRecruiterApplications(items);
    } catch (error) {
      setRecruiterApplications([]);
      notify(
        `${error.message} Check that the recruiter applications routes are added to backend/server.js.`,
        "error"
      );
    }
  }, [token, isRecruiter]);

  const loadProfile = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiRequest("/api/auth/me", {}, token);
      setProfile(data.student || data.user || student);
    } catch {
      setProfile(student);
    }
  }, [token, student]);

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      await loadJobs();

      if (isLoggedIn && isRecruiter) {
        await loadRecruiterApplications();
      } else if (isLoggedIn) {
        await loadApplications();
      }

      if (isLoggedIn) await loadProfile();
    } finally {
      setLoading(false);
    }
  }, [
    isLoggedIn,
    isRecruiter,
    loadJobs,
    loadApplications,
    loadRecruiterApplications,
    loadProfile,
  ]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateAuthForm = (key, value) => {
    setAuthForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      const registering = authMode === "register";

      const payload = registering
        ? {
            name: authForm.name.trim(),
            email: authForm.email.trim().toLowerCase(),
            password: authForm.password,
            role: authRole,
            ...(authRole === "student"
              ? {
                  branch: authForm.branch,
                  cgpa: Number(authForm.cgpa),
                  graduationYear: Number(authForm.graduationYear),
                }
              : {}),
          }
        : {
            email: authForm.email.trim().toLowerCase(),
            password: authForm.password,
          };

      const data = await apiRequest(
        registering ? "/api/auth/register" : "/api/auth/login",
        { method: "POST", body: JSON.stringify(payload) }
      );

      if (registering) {
        notify("Account created! Please log in.");
        setAuthMode("login");
        setAuthForm((prev) => ({ ...prev, password: "" }));
        return;
      }

      if (!data.token || !data.student) {
        throw new Error("The server did not return a valid login session.");
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("student", JSON.stringify(data.student));

      setSession({ token: data.token, student: data.student });
      setProfile(data.student);
      setPage("dashboard");
      notify(`Welcome, ${data.student.name}!`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("student");
    setSession({ token: "", student: null });
    setProfile(null);
    setApplications([]);
    setRecruiterApplications([]);
    setPage("dashboard");
    setNotice(null);
    setAuthMode("login");
  };

  const postJob = async (event) => {
    event.preventDefault();
    setSavingJob(true);

    try {
      const payload = {
        company: jobForm.company.trim(),
        role: jobForm.role.trim(),
        location: jobForm.location.trim(),
        salary: jobForm.salary.trim(),
        minCGPA: Number(jobForm.minCGPA),
        skills: jobForm.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description: jobForm.description.trim(),
      };

      const data = await apiRequest(
        "/api/jobs",
        { method: "POST", body: JSON.stringify(payload) },
        token
      );

      if (data.job) {
        setJobs((prev) => [
          data.job,
          ...prev.filter(
            (job) =>
              String(job.id || job._id) !==
              String(data.job.id || data.job._id)
          ),
        ]);
      } else {
        await loadJobs();
      }

      setJobForm(EMPTY_JOB);
      notify(data.message || "Job posted successfully!");
      setPage("manage-jobs");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSavingJob(false);
    }
  };

  const applyForJob = async (job) => {
    if (isRecruiter) {
      notify("Recruiter accounts cannot apply for jobs.", "error");
      return;
    }

    if (applyingJobId) return;

    setApplyingJobId(String(job.id || job._id));

    try {
      const data = await apiRequest(
        "/api/applications",
        {
          method: "POST",
          body: JSON.stringify({ jobId: String(job.id || job._id) }),
        },
        token
      );

      await loadApplications();
      notify(data.message || "Application submitted successfully!");
    } catch (error) {
      await loadApplications();
      notify(error.message, "error");
    } finally {
      setApplyingJobId("");
    }
  };

  const updateApplicationStatus = async (application, status) => {
    const id = application._id || application.id;

    if (!id) {
      notify(
        "This application has no database ID, so its status cannot be updated.",
        "error"
      );
      return;
    }

    setUpdatingApplicationId(String(id));

    try {
      const data = await apiRequest(
        `/api/recruiter/applications/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
        token
      );

      setRecruiterApplications((prev) =>
        prev.map((item) =>
          String(item._id || item.id) === String(id)
            ? { ...item, ...(data.application || {}), status }
            : item
        )
      );

      notify(data.message || `Application status changed to ${status}.`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setUpdatingApplicationId("");
    }
  };

  const closeJob = async (job) => {
    if (!job?.id) {
      notify("This job is missing its ID.", "error");
      return;
    }

    if (job.status === "Closed") {
      notify("This job is already closed.", "error");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to close ${job.role} at ${job.company}?`
      )
    ) {
      return;
    }

    try {
      const data = await apiRequest(
        `/api/jobs/${job.id}/close`,
        { method: "PATCH" },
        token
      );

      setJobs((previous) =>
        previous.map((item) =>
          String(item.id) === String(job.id)
            ? { ...item, ...data.job, status: "Closed" }
            : item
        )
      );

      notify(data.message || "Job closed successfully.");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const myJobs = jobs.filter((job) => {
    const owner =
      typeof job.recruiterId === "object"
        ? job.recruiterId?._id
        : job.recruiterId;

    return owner && String(owner) === String(student?.id || student?._id);
  });

  const filteredJobs = jobs.filter((job) => {
    if (job.status === "Closed") return false;

    const q = search.trim().toLowerCase();
    const skills = Array.isArray(job.skills) ? job.skills : [];

    return (
      !q ||
      [job.company, job.role, job.location, ...skills]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  });

  const hasApplied = (job) =>
    applications.some(
      (application) =>
        String(application.jobId) === String(job.id || job._id)
    );

  const navItems = isRecruiter
    ? [
        { id: "dashboard", label: "Dashboard", icon: "▦" },
        { id: "post-job", label: "Post a Job", icon: "+" },
        { id: "manage-jobs", label: "Manage Jobs", icon: "▤" },
        { id: "applicants", label: "Applicants", icon: "♙" },
      ]
    : [
        { id: "dashboard", label: "Dashboard", icon: "▦" },
        { id: "find-jobs", label: "Find Jobs", icon: "⌕" },
        { id: "applications", label: "My Applications", icon: "▤" },
        { id: "profile", label: "My Profile", icon: "◉" },
      ];

  const pageTitle = {
    dashboard: "Dashboard",
    "post-job": "Post a Job",
    "manage-jobs": "Manage Jobs",
    applicants: "Applicants",
    "find-jobs": "Find Jobs",
    applications: "My Applications",
    profile: "My Profile",
  }[page] || "Dashboard";

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white px-6 py-5">
          <h1 className="text-xl font-black text-indigo-700">CampusConnect</h1>
          <p className="text-xs text-slate-500">Campus Recruitment Portal</p>
        </header>

        <main className="mx-auto grid min-h-[85vh] max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2">
          <div className="hidden lg:block">
            <p className="font-bold uppercase tracking-widest text-indigo-600">
              Your career starts here
            </p>
            <h2 className="mt-4 text-5xl font-black leading-tight">
              Connect your talent with the right opportunity.
            </h2>
            <p className="mt-5 leading-7 text-slate-500">
              Discover campus placements, track applications, and connect
              students with recruiters in one place.
            </p>
          </div>

          <Card className="mx-auto w-full max-w-lg">
            <h2 className="text-2xl font-extrabold">
              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {authMode === "login"
                ? "Log in to CampusConnect."
                : "Join CampusConnect to get started."}
            </p>

            <div className="mt-4">
              <Notice notice={notice} onClose={() => setNotice(null)} />
            </div>

            <form onSubmit={handleAuth} className="mt-5 space-y-4">
              {authMode === "register" && (
                <>
                  <div>
                    <p className="mb-2 text-sm font-semibold">Register as</p>
                    <div className="grid grid-cols-2 gap-3">
                      {["student", "recruiter"].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setAuthRole(item)}
                          className={`rounded-xl border p-3 font-semibold capitalize ${
                            authRole === item
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field
                    label="Full name"
                    value={authForm.name}
                    onChange={(v) => updateAuthForm("name", v)}
                    required
                  />

                  {authRole === "student" && (
                    <>
                      <Field
                        label="Branch"
                        value={authForm.branch}
                        onChange={(v) => updateAuthForm("branch", v)}
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="CGPA"
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          value={authForm.cgpa}
                          onChange={(v) => updateAuthForm("cgpa", v)}
                          required
                        />
                        <Field
                          label="Graduation year"
                          type="number"
                          value={authForm.graduationYear}
                          onChange={(v) =>
                            updateAuthForm("graduationYear", v)
                          }
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <Field
                label="Email address"
                type="email"
                value={authForm.email}
                onChange={(v) => updateAuthForm("email", v)}
                required
              />
              <Field
                label="Password"
                type="password"
                value={authForm.password}
                onChange={(v) => updateAuthForm("password", v)}
                required
              />

              <Button type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Log In"
                    : "Create Account"}
              </Button>

              <p className="text-center text-sm text-slate-500">
                {authMode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  type="button"
                  className="font-semibold text-indigo-600"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setNotice(null);
                  }}
                >
                  {authMode === "login" ? "Register" : "Log in"}
                </button>
              </p>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-6 py-5">
          <h1 className="text-lg font-black text-indigo-700">CampusConnect</h1>
          <p className="text-xs text-slate-500">Recruitment Portal</p>
        </div>

        <nav className="space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => changePage(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${
                page === item.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 p-4">
          <p className="truncate text-sm font-bold">{student?.name}</p>
          <p className="text-xs capitalize text-slate-500">{role}</p>
          <Button variant="danger" onClick={logout}>
            Log out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                CampusConnect / {page}
              </p>
              <h1 className="mt-1 text-xl font-extrabold">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge>{role}</Badge>
              <span className="hidden text-sm font-semibold sm:inline">
                {student?.name}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border px-3 py-2 text-sm lg:hidden"
              >
                Log out
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-5 pb-3 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => changePage(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${
                  page === item.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          <Notice notice={notice} onClose={() => setNotice(null)} />

          {loading && (
            <p className="mb-4 text-sm text-slate-500">
              Refreshing portal data...
            </p>
          )}

          {page === "dashboard" && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-600 p-7 text-white sm:p-10">
                <p className="text-sm font-semibold text-indigo-100">
                  YOUR CAMPUS RECRUITMENT WORKSPACE
                </p>
                <h2 className="mt-3 text-3xl font-black">
                  Welcome, {student?.name}!
                </h2>
                <p className="mt-3 leading-7 text-indigo-100">
                  {isRecruiter
                    ? "Publish opportunities and review student applications."
                    : "Find opportunities, apply for jobs, and track your placement journey."}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {isRecruiter ? (
                    <>
                      <Button onClick={() => changePage("post-job")}>
                        + Post a Job
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => changePage("applicants")}
                      >
                        View Applicants
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => changePage("find-jobs")}>
                        Explore Jobs
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => changePage("applications")}
                      >
                        My Applications
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Dashboard Analytics */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {isRecruiter ? (
                  <>
                    <Card>
                      <p className="text-sm text-slate-500">
                        Your Job Listings
                      </p>
                      <p className="mt-3 text-3xl font-black">
                        {myJobs.length}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Jobs posted by your account
                      </p>
                    </Card>

                    <Card>
                      <p className="text-sm text-slate-500">Open Jobs</p>
                      <p className="mt-3 text-3xl font-black text-emerald-600">
                        {
                          myJobs.filter((job) => job.status !== "Closed")
                            .length
                        }
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Currently accepting applications
                      </p>
                    </Card>

                    <Card>
                      <p className="text-sm text-slate-500">
                        Applications Received
                      </p>
                      <p className="mt-3 text-3xl font-black">
                        {recruiterApplications.length}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Across your job listings
                      </p>
                    </Card>

                    <Card>
                      <p className="text-sm text-slate-500">
                        Shortlisted Students
                      </p>
                      <p className="mt-3 text-3xl font-black text-indigo-600">
                        {
                          recruiterApplications.filter(
                            (application) =>
                              application.status === "Shortlisted"
                          ).length
                        }
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Applications marked shortlisted
                      </p>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card>
                      <p className="text-sm text-slate-500">Available Jobs</p>
                      <p className="mt-3 text-3xl font-black">
                        {
                          jobs.filter((job) => job.status !== "Closed").length
                        }
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Open opportunities to explore
                      </p>
                    </Card>

                    <Card>
                      <p className="text-sm text-slate-500">
                        Applications Submitted
                      </p>
                      <p className="mt-3 text-3xl font-black">
                        {applications.length}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Your placement applications
                      </p>
                    </Card>

                    <Card>
                      <p className="text-sm text-slate-500">Shortlisted</p>
                      <p className="mt-3 text-3xl font-black text-indigo-600">
                        {
                          applications.filter(
                            (application) =>
                              application.status === "Shortlisted"
                          ).length
                        }
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Applications shortlisted
                      </p>
                    </Card>

                    <Card>
                      <p className="text-sm text-slate-500">Selected</p>
                      <p className="mt-3 text-3xl font-black text-emerald-600">
                        {
                          applications.filter(
                            (application) => application.status === "Selected"
                          ).length
                        }
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Successful selections
                      </p>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

          {page === "post-job" && isRecruiter && (
            <Card className="max-w-3xl">
              <h2 className="mb-5 text-xl font-bold">Create a Job Posting</h2>
              <form onSubmit={postJob} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Company"
                    value={jobForm.company}
                    onChange={(v) => setJobForm({ ...jobForm, company: v })}
                    required
                  />
                  <Field
                    label="Job role"
                    value={jobForm.role}
                    onChange={(v) => setJobForm({ ...jobForm, role: v })}
                    required
                  />
                  <Field
                    label="Location"
                    value={jobForm.location}
                    onChange={(v) => setJobForm({ ...jobForm, location: v })}
                    required
                  />
                  <Field
                    label="Salary"
                    value={jobForm.salary}
                    onChange={(v) => setJobForm({ ...jobForm, salary: v })}
                    placeholder="4 LPA"
                    required
                  />
                  <Field
                    label="Minimum CGPA"
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={jobForm.minCGPA}
                    onChange={(v) => setJobForm({ ...jobForm, minCGPA: v })}
                    required
                  />
                  <Field
                    label="Skills (comma separated)"
                    value={jobForm.skills}
                    onChange={(v) => setJobForm({ ...jobForm, skills: v })}
                    placeholder="Python, SQL, React"
                    required
                  />
                </div>
                <Field
                  label="Job description"
                  value={jobForm.description}
                  onChange={(v) =>
                    setJobForm({ ...jobForm, description: v })
                  }
                  rows={4}
                  required
                />
                <Button type="submit" disabled={savingJob}>
                  {savingJob ? "Posting..." : "Post Job"}
                </Button>
              </form>
            </Card>
          )}

          {page === "manage-jobs" && isRecruiter && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Your job postings</h2>
                <Button onClick={() => changePage("post-job")}>
                  + Post a Job
                </Button>
              </div>

              {myJobs.length ? (
                myJobs.map((job) => (
                  <JobCard
                    key={job.id || job._id}
                    job={job}
                    recruiter
                    onClose={closeJob}
                  />
                ))
              ) : (
                <Card>
                  <h3 className="font-bold">No posted jobs yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Post a job to start receiving applications.
                  </p>
                </Card>
              )}
            </div>
          )}

          {page === "applicants" && isRecruiter && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Student Applicants</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review applications for jobs posted by your account.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={loadRecruiterApplications}
                >
                  Refresh Applicants
                </Button>
              </div>

              {recruiterApplications.length === 0 ? (
                <Card>
                  <h3 className="font-bold">No applicants found</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    If a student has already applied, confirm that the backend
                    contains GET /api/recruiter/applications and that the job
                    was posted by this recruiter account.
                  </p>
                </Card>
              ) : (
                <Card className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-3">Student</th>
                        <th className="px-3 py-3">Email</th>
                        <th className="px-3 py-3">Company</th>
                        <th className="px-3 py-3">Job Role</th>
                        <th className="px-3 py-3">Applied On</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recruiterApplications.map((application) => {
                        const id = application._id || application.id;

                        return (
                          <tr
                            key={
                              id ||
                              `${application.studentEmail}-${application.jobId}`
                            }
                          >
                            <td className="px-3 py-4 font-semibold">
                              {application.studentName || "Student"}
                            </td>
                            <td className="px-3 py-4">
                              {application.studentEmail || "—"}
                            </td>
                            <td className="px-3 py-4">
                              {application.company || "—"}
                            </td>
                            <td className="px-3 py-4">
                              {application.role || "—"}
                            </td>
                            <td className="px-3 py-4">
                              {application.createdAt
                                ? new Date(
                                    application.createdAt
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-3 py-4">
                              <Badge
                                color={
                                  application.status === "Selected"
                                    ? "green"
                                    : application.status === "Rejected"
                                      ? "red"
                                      : application.status === "Shortlisted"
                                        ? "amber"
                                        : "indigo"
                                }
                              >
                                {application.status || "Submitted"}
                              </Badge>
                            </td>
                            <td className="px-3 py-4">
                              <select
                                className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
                                value={
                                  application.status === "Submitted"
                                    ? "Under Review"
                                    : application.status || "Under Review"
                                }
                                disabled={
                                  updatingApplicationId === String(id)
                                }
                                onChange={(e) =>
                                  updateApplicationStatus(
                                    application,
                                    e.target.value
                                  )
                                }
                              >
                                {STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              {updatingApplicationId === String(id) && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Saving...
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          )}

          {page === "find-jobs" && !isRecruiter && (
            <div className="space-y-5">
              <Field
                label="Search jobs"
                value={search}
                onChange={setSearch}
                placeholder="Search by company, role, location, or skill"
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id || job._id}
                    job={job}
                    onApply={applyForJob}
                    applying={
                      applyingJobId === String(job.id || job._id)
                    }
                    applied={hasApplied(job)}
                  />
                ))}
              </div>
              {filteredJobs.length === 0 && (
                <Card>No jobs match your search.</Card>
              )}
            </div>
          )}

          {page === "applications" && !isRecruiter && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">My Applications</h2>
                <Button variant="secondary" onClick={loadApplications}>
                  Refresh
                </Button>
              </div>

              {applications.length === 0 ? (
                <Card>
                  <p className="font-bold">No applications yet</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Open Find Jobs to apply for a position.
                  </p>
                </Card>
              ) : (
                applications.map((application, i) => (
                  <Card
                    key={
                      application._id ||
                      application.id ||
                      `${application.jobId}-${i}`
                    }
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">
                          {application.role || "Job Application"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {application.company || "Company not specified"}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          Applied:{" "}
                          {application.createdAt
                            ? new Date(
                                application.createdAt
                              ).toLocaleDateString()
                            : "Date not available"}
                        </p>
                      </div>
                      <Badge
                        color={
                          application.status === "Selected"
                            ? "green"
                            : application.status === "Rejected"
                              ? "red"
                              : application.status === "Shortlisted"
                                ? "amber"
                                : "indigo"
                        }
                      >
                        {application.status || "Submitted"}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {page === "profile" && !isRecruiter && (
            <div className="max-w-2xl">
              <Card>
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-black text-indigo-700">
                    {(profile?.name || student?.name || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">
                      {profile?.name || student?.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {profile?.email || student?.email}
                    </p>
                    <Badge>{role}</Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    ["Full Name", profile?.name || student?.name || "—"],
                    ["Email", profile?.email || student?.email || "—"],
                    [
                      "Branch",
                      profile?.branch ||
                        student?.branch ||
                        "Not specified",
                    ],
                    [
                      "CGPA",
                      profile?.cgpa ?? student?.cgpa ?? "Not specified",
                    ],
                    [
                      "Graduation Year",
                      profile?.graduationYear ??
                        student?.graduationYear ??
                        "Not specified",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-3"
                    >
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-400">
          CampusConnect · Campus Recruitment Portal
        </footer>
      </div>
    </div>
  );
}
