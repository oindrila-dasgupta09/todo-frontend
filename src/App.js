import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const FILTERS = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed",
};

const SORTS = {
  NEWEST: "newest",
  OLDEST: "oldest",
  TITLE: "title",
};

const COMPLETION_STORAGE_KEY = "todo_completed_status";
const USER_STORAGE_KEY = "todo_user_accounts";
const CURRENT_USER_KEY = "todo_current_user";
const USER_TASKS_KEY_PREFIX = "todo_tasks_";
const USER_ACTIVITIES_KEY_PREFIX = "todo_activities_";

function App() {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState("");
  const [completionMap, setCompletionMap] = useState(() => {
    try {
      const stored = localStorage.getItem(COMPLETION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [sortOrder, setSortOrder] = useState(SORTS.NEWEST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return localStorage.getItem(CURRENT_USER_KEY) || "";
    } catch {
      return "";
    }
  });
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFirstName, setAuthFirstName] = useState("");
  const [authLastName, setAuthLastName] = useState("");
  const [authError, setAuthError] = useState("");
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "https://todo-app-x6s5.onrender.com";
  const TASKS_API = `${API_BASE_URL}/tasks`;
  const ACTIVITIES_API = `${API_BASE_URL}/activities`;

  const getTaskIdDate = useCallback((taskId) => {
    const numericId = Number(taskId);
    if (Number.isNaN(numericId)) return null;
    const parsedFromId = new Date(numericId);
    if (Number.isNaN(parsedFromId.getTime())) return null;
    return parsedFromId.toISOString();
  }, []);

  const saveCompletionMap = (nextMap) => {
    try {
      localStorage.setItem(COMPLETION_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {}
  };

  const getUserKey = (prefix, username) => `${prefix}${username}`;

  const loadUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const saveUsers = (users) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    } catch {}
  };

  const loadTasksForUser = (username) => {
    if (!username) return [];
    try {
      return JSON.parse(localStorage.getItem(getUserKey(USER_TASKS_KEY_PREFIX, username))) || [];
    } catch {
      return [];
    }
  };

  const saveTasksForUser = (username, nextTasks) => {
    if (!username) return;
    try {
      localStorage.setItem(getUserKey(USER_TASKS_KEY_PREFIX, username), JSON.stringify(nextTasks));
    } catch {}
  };

  const loadActivitiesForUser = (username) => {
    if (!username) return [];
    try {
      return JSON.parse(localStorage.getItem(getUserKey(USER_ACTIVITIES_KEY_PREFIX, username))) || [];
    } catch {
      return [];
    }
  };

  const saveActivitiesForUser = (username, nextActivities) => {
    if (!username) return;
    try {
      localStorage.setItem(getUserKey(USER_ACTIVITIES_KEY_PREFIX, username), JSON.stringify(nextActivities));
    } catch {}
  };

  const addActivity = (activity) => {
    if (!currentUser) return;
    const nextActivities = [activity, ...activities].slice(0, 20);
    setActivities(nextActivities);
    saveActivitiesForUser(currentUser, nextActivities);
  };

  const getAccount = (users, username) => {
    const account = users[username];
    if (account == null) return null;
    if (typeof account === "string") {
      return { provider: "local", password: account, email: username };
    }
    return account;
  };

  const handleLogin = (event) => {
    event?.preventDefault();
    const username = authUsername.trim().toLowerCase();
    if (!username || !authPassword) {
      setAuthError("Enter both username and password.");
      return;
    }

    const users = loadUsers();
    const account = getAccount(users, username);
    if (!account || account.provider !== "local") {
      setAuthError("Invalid username or password.");
      setForgotPasswordVisible(false);
      return;
    }

    if (account.password !== authPassword) {
      setAuthError("Invalid username or password.");
      setForgotPasswordVisible(true);
      return;
    }

    setCurrentUser(username);
    setForgotPasswordVisible(false);
    try {
      localStorage.setItem(CURRENT_USER_KEY, username);
    } catch {}
    setAuthError("");
  };

  const handleSignup = (event) => {
    event?.preventDefault();
    const username = authUsername.trim().toLowerCase();
    const firstName = authFirstName.trim();
    const lastName = authLastName.trim();

    if (!firstName || !lastName || !username || !authPassword) {
      setAuthError("Enter first & last name, email, and password to sign up.");
      return;
    }

    const users = loadUsers();
    if (users[username]) {
      setAuthError("Email already exists. Choose another.");
      return;
    }

    const nextUsers = {
      ...users,
      [username]: {
        provider: "local",
        password: authPassword,
        email: username,
        firstName,
        lastName,
      },
    };
    saveUsers(nextUsers);
    setCurrentUser(username);
    try {
      localStorage.setItem(CURRENT_USER_KEY, username);
    } catch {}
    setAuthError("");
  };

  const handleForgotPassword = () => {
    const email = authUsername.trim().toLowerCase() || window.prompt("Enter your email address to reset your password:");
    if (!email) {
      return;
    }

    const username = email.trim().toLowerCase();
    const users = loadUsers();
    const account = getAccount(users, username);

    if (!account || account.provider !== "local") {
      setAuthError("No local account found for that email.");
      return;
    }

    const newPassword = window.prompt("Enter your new password:");
    if (!newPassword) {
      return;
    }

    const confirmPassword = window.prompt("Confirm your new password:");
    if (newPassword !== confirmPassword) {
      setAuthError("Passwords do not match. Please try again.");
      return;
    }

    const nextUsers = {
      ...users,
      [username]: {
        ...account,
        password: newPassword,
      },
    };

    saveUsers(nextUsers);
    setAuthPassword("");
    setAuthError("Password reset successful. Please login with your new password.");
  };

  const handleLogout = () => {
    setCurrentUser("");
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {}
    setTasks([]);
    setActivities([]);
    setEditId(null);
    setTitle("");
    setSearchQuery("");
    setFilter(FILTERS.ALL);
    setSortOrder(SORTS.NEWEST);
  };

  const normalizeTask = useCallback(
    (task) => {
      const fallbackFromId = getTaskIdDate(task.id);
      const createdAt = task.createdAt || fallbackFromId;
      const updatedAt = task.updatedAt || createdAt || fallbackFromId;
      return {
        id: String(task.id),
        ...task,
        createdAt,
        updatedAt,
        completed: Boolean(task.completed),
      };
    },
    [getTaskIdDate]
  );

  const formatTime = (value) => {
    if (!value) return "Not available yet";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not available yet";
    return parsed.toLocaleString();
  };

  const buildFallbackActivities = (taskList) => {
    const fallback = [];
    taskList.forEach((task) => {
      if (task.createdAt) {
        fallback.push({
          id: `fallback-added-${task.id}`,
          type: "added",
          taskId: task.id,
          title: task.title,
          timestamp: task.createdAt,
        });
      }

      if (task.updatedAt && task.updatedAt !== task.createdAt) {
        fallback.push({
          id: `fallback-updated-${task.id}`,
          type: "updated",
          taskId: task.id,
          title: task.title,
          timestamp: task.updatedAt,
        });
      }
    });

    return fallback.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const fetchTasks = useCallback(async () => {
    if (!currentUser) {
      setTasks([]);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const savedTasks = loadTasksForUser(currentUser).map(normalizeTask);
      setTasks(savedTasks);
    } catch (err) {
      setError("Unable to load tasks. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, normalizeTask]);

  const fetchActivities = useCallback(async () => {
    if (!currentUser) {
      setActivities([]);
      return;
    }

    try {
      const savedActivities = loadActivitiesForUser(currentUser);
      setActivities(Array.isArray(savedActivities) ? savedActivities : []);
    } catch {
      setActivities([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      fetchActivities();
    } else {
      setTasks([]);
      setActivities([]);
    }
  }, [currentUser, fetchTasks, fetchActivities]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const visibleActivities =
    activities.length > 0 ? activities : buildFallbackActivities(tasks);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks
      .filter((task) => task.title.toLowerCase().includes(query))
      .filter((task) => {
        if (filter === FILTERS.COMPLETED) return task.completed;
        if (filter === FILTERS.ACTIVE) return !task.completed;
        return true;
      });
  }, [tasks, searchQuery, filter]);

  const sortedTasks = useMemo(() => {
    const tasksToSort = [...filteredTasks];
    if (sortOrder === SORTS.OLDEST) {
      return tasksToSort.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    if (sortOrder === SORTS.TITLE) {
      return tasksToSort.sort((a, b) => a.title.localeCompare(b.title));
    }

    return tasksToSort.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredTasks, sortOrder]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;
  const activeTasks = sortedTasks.filter((task) => !task.completed);
  const completedTasksList = sortedTasks.filter((task) => task.completed);
  const showActiveSection = filter !== FILTERS.COMPLETED;
  const showCompletedSection = filter !== FILTERS.ACTIVE;

  const resetForm = () => {
    setTitle("");
    setEditId(null);
  };

  const addTask = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !currentUser) return;

    const id = String(Date.now());
    const nextTasks = [
      {
        id,
        title: cleanTitle,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...tasks,
    ];

    setTasks(nextTasks);
    saveTasksForUser(currentUser, nextTasks);
    addActivity({
      id: `activity-${Date.now()}`,
      type: "added",
      taskId: id,
      title: cleanTitle,
      timestamp: new Date().toISOString(),
    });
    resetForm();
  };

  const updateTask = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !editId || !currentUser) return;

    const nextTasks = tasks.map((task) =>
      task.id === editId
        ? {
            ...task,
            title: cleanTitle,
            updatedAt: new Date().toISOString(),
          }
        : task
    );

    setTasks(nextTasks);
    saveTasksForUser(currentUser, nextTasks);
    const updatedTask = nextTasks.find((task) => task.id === editId);
    if (updatedTask) {
      addActivity({
        id: `activity-${Date.now()}`,
        type: "updated",
        taskId: updatedTask.id,
        title: updatedTask.title,
        timestamp: updatedTask.updatedAt,
      });
    }
    resetForm();
  };

  const deleteTask = (id) => {
    if (!currentUser) return;
    const nextTasks = tasks.filter((task) => task.id !== id);
    setTasks(nextTasks);
    saveTasksForUser(currentUser, nextTasks);
    addActivity({
      id: `activity-${Date.now()}`,
      type: "deleted",
      taskId: id,
      title: tasks.find((task) => task.id === id)?.title || "Task",
      timestamp: new Date().toISOString(),
    });
  };

  const toggleCompletion = (task) => {
    if (!currentUser) return;
    const nextCompleted = !task.completed;
    const nextTasks = tasks.map((item) =>
      item.id === task.id ? { ...item, completed: nextCompleted, updatedAt: new Date().toISOString() } : item
    );

    setTasks(nextTasks);
    saveTasksForUser(currentUser, nextTasks);
    addActivity({
      id: `activity-${Date.now()}`,
      type: nextCompleted ? "completed" : "reopened",
      taskId: task.id,
      title: task.title,
      timestamp: new Date().toISOString(),
    });
  };

  const clearCompleted = () => {
    if (!currentUser) return;
    const completedTasks = tasks.filter((task) => task.completed);
    if (completedTasks.length === 0) return;

    const nextTasks = tasks.filter((task) => !task.completed);
    setTasks(nextTasks);
    saveTasksForUser(currentUser, nextTasks);
    addActivity({
      id: `activity-${Date.now()}`,
      type: "cleared",
      taskId: "all-completed",
      title: `${completedTasks.length} completed tasks removed`,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="App">
      <div className="app-shell">
        <div className="app-card">
          {!currentUser ? (
            <div className="auth-card">
              <p className="eyebrow">User login required</p>
              <h1>{isSigningUp ? "Create account" : "Login to Todo"}</h1>
              <p className="hero-copy">
                Sign in to keep your tasks safe and user-specific. Your data is stored per account in this browser.
              </p>

              {authError && <div className="error-banner">{authError}</div>}

              <form className="auth-form" onSubmit={isSigningUp ? handleSignup : handleLogin}>
                {isSigningUp && (
                  <>
                    <input
                      className="search-input"
                      type="text"
                      value={authFirstName}
                      onChange={(e) => setAuthFirstName(e.target.value)}
                      placeholder="First name"
                    />
                    <input
                      className="search-input"
                      type="text"
                      value={authLastName}
                      onChange={(e) => setAuthLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </>
                )}
                <input
                  className="search-input"
                  type="email"
                  value={authUsername}
                  onChange={(e) => {
                    setAuthUsername(e.target.value);
                    setForgotPasswordVisible(false);
                  }}
                  placeholder="Email address"
                />
                <input
                  className="search-input"
                  type="password"
                  value={authPassword}
                  onChange={(e) => {
                    setAuthPassword(e.target.value);
                    setForgotPasswordVisible(false);
                  }}
                  placeholder="Password"
                />
                <div className="auth-actions">
                  <button type="submit" className="button primary-button">
                    {isSigningUp ? "Sign up" : "Login"}
                  </button>
                  {!isSigningUp && forgotPasswordVisible && (
                    <button type="button" className="button secondary-button" onClick={handleForgotPassword}>
                      Forgot password?
                    </button>
                  )}
                  <button
                    type="button"
                    className="button secondary-button"
                    onClick={() => {
                      setIsSigningUp(!isSigningUp);
                      setAuthError("");
                      setForgotPasswordVisible(false);
                      setAuthFirstName("");
                      setAuthLastName("");
                    }}
                  >
                    {isSigningUp ? "Have account? Login" : "Create account"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <header className="hero">
                <div className="hero-row">
                  <div>
                    <p className="eyebrow">Modern task management</p>
                    <h1>Todo App</h1>
                    <p className="hero-copy">
                      Keep your day on track with smart search, filters, and built-in activity insights.
                    </p>
                  </div>
                  <div className="user-panel">
                    <span>Signed in as <strong>{currentUser}</strong></span>
                    <button type="button" className="button secondary-button" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                </div>
              </header>

          <section className="stats-grid">
            <article className="stat-card">
              <span className="stat-label">Total tasks</span>
              <strong>{tasks.length}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-label">Active</span>
              <strong>{activeCount}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-label">Completed</span>
              <strong>{completedCount}</strong>
            </article>
          </section>

          <div className="controls-row">
            <input
              className="search-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a new task..."
            />
            <button
              className="button primary-button"
              onClick={editId ? updateTask : addTask}
            >
              {editId ? "Save update" : "Add task"}
            </button>
          </div>

          <div className="controls-row">
            <input
              className="search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks"
            />
            <div className="filter-pills">
              {Object.values(FILTERS).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`filter-chip ${filter === mode ? "active" : ""}`}
                  onClick={() => setFilter(mode)}
                >
                  {mode === FILTERS.ALL
                    ? "All"
                    : mode === FILTERS.ACTIVE
                    ? "Active"
                    : "Completed"}
                </button>
              ))}
            </div>
            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value={SORTS.NEWEST}>Newest first</option>
              <option value={SORTS.OLDEST}>Oldest first</option>
              <option value={SORTS.TITLE}>Title A - Z</option>
            </select>
          </div>

          <div className="top-bar">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              className="activity-toggle"
              onClick={() => setIsActivityOpen(!isActivityOpen)}
            >
              <span>Recent activity</span>
              <span className={`dropdown-symbol ${isActivityOpen ? 'open' : ''}`}>▼</span>
            </button>
            <button
              type="button"
              className="button secondary-button"
              onClick={clearCompleted}
              disabled={completedCount === 0}
            >
              Clear completed
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {loading && <div className="status-banner">Loading tasks…</div>}

          {showActiveSection && (
            <div className="task-list">
              <div className="section-header">
                <h2>Active tasks</h2>
                <span className="section-count">{activeTasks.length}</span>
              </div>
              {activeTasks.length === 0 && !loading ? (
                <div className="empty-state">
                  <p>No active tasks found.</p>
                </div>
              ) : (
                activeTasks.map((task) => (
                  <article key={task.id} className="task-item">
                    <button
                      type="button"
                      className={`task-btn complete-btn ${task.completed ? "completed" : ""}`}
                      onClick={() => toggleCompletion(task)}
                    >
                      {task.completed ? "✅ Done" : "○ Mark done"}
                    </button>

                    <div className="task-meta">
                      <div className="task-title">{task.title}</div>
                      <div className="task-labels">
                        <span className="badge">
                          {task.completed ? "Completed" : "Pending"}
                        </span>
                        <span className="task-label">
                          Added {formatTime(task.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="task-btn update-btn"
                        onClick={() => {
                          setEditId(task.id);
                          setTitle(task.title);
                        }}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="task-btn delete-btn"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {(showCompletedSection || completedTasksList.length > 0) && (
            <div className="task-list completed-list">
              <div className="task-items">
                {completedTasksList.length === 0 ? (
                  <div className="empty-state">
                    <p>No completed tasks yet.</p>
                  </div>
                ) : (
                  completedTasksList.map((task) => (
                    <article key={task.id} className="task-item completed-item">
                      <button
                        type="button"
                        className={`task-btn complete-btn ${task.completed ? "completed" : ""}`}
                        onClick={() => toggleCompletion(task)}
                      >
                        {task.completed ? "✅ Done" : "○ Mark done"}
                      </button>

                      <div className="task-meta">
                        <div className="task-title">{task.title}</div>
                        <div className="task-labels">
                          <span className="badge completed-badge">Completed</span>
                          <span className="task-label">
                            Added {formatTime(task.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="task-actions">
                        <button
                          type="button"
                          className="task-btn delete-btn"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="activity-panel">
            {isActivityOpen && (
              <div className="activity-list">
                {visibleActivities.length === 0 ? (
                  <div className="empty-state">
                    <p>No activity yet. Add or update a task to get started.</p>
                  </div>
                ) : (
                  visibleActivities.map((item) => (
                    <div key={item.id} className="activity-item">
                      <span className="activity-marker">•</span>
                      <div>
                        <strong>{item.title}</strong> was <strong>{item.type}</strong> at {formatTime(item.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
