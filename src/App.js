
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

const USER_STORAGE_KEY = "todo_user_accounts";
const CURRENT_USER_KEY = "todo_current_user";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [sortOrder, setSortOrder] = useState(SORTS.NEWEST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem(CURRENT_USER_KEY) || "";
  });

  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFirstName, setAuthFirstName] = useState("");
  const [authLastName, setAuthLastName] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://todo-app-x6s5.onrender.com";

  const TASKS_API = `${API_BASE_URL}/tasks`;

  const loadUsers = () => {
    try {
      return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const saveUsers = (users) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const username = authUsername.trim().toLowerCase();

    const users = loadUsers();

    if (!users[username]) {
      setAuthError("User not found");
      return;
    }

    if (users[username].password !== authPassword) {
      setAuthError("Wrong password");
      return;
    }

    setCurrentUser(username);
    localStorage.setItem(CURRENT_USER_KEY, username);
    setAuthError("");
  };

  const handleSignup = (e) => {
    e.preventDefault();

    const username = authUsername.trim().toLowerCase();

    const users = loadUsers();

    if (users[username]) {
      setAuthError("User already exists");
      return;
    }

    users[username] = {
      firstName: authFirstName,
      lastName: authLastName,
      password: authPassword,
    };

    saveUsers(users);

    setCurrentUser(username);
    localStorage.setItem(CURRENT_USER_KEY, username);
  };

  const handleLogout = () => {
    setCurrentUser("");
    localStorage.removeItem(CURRENT_USER_KEY);
    setTasks([]);
  };

  const normalizeTask = (task) => ({
    ...task,
    completed: Boolean(task.completed),
  });

  const fetchTasks = useCallback(async () => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${TASKS_API}?email=${encodeURIComponent(currentUser)}`
      );

      const data = await response.json();

      setTasks(Array.isArray(data) ? data.map(normalizeTask) : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const addTask = async () => {
    const cleanTitle = title.trim();

    if (!cleanTitle) return;

    try {
      const response = await fetch(TASKS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser,
          title: cleanTitle,
          completed: false,
        }),
      });

      const newTask = await response.json();

      setTasks((prev) => [normalizeTask(newTask), ...prev]);

      setTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const updateTask = async () => {
    if (!editId) return;

    try {
      const response = await fetch(`${TASKS_API}/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser,
          title,
        }),
      });

      const updatedTask = await response.json();

      setTasks((prev) =>
        prev.map((task) =>
          task.id === editId ? normalizeTask(updatedTask) : task
        )
      );

      setEditId(null);
      setTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${TASKS_API}/${id}?email=${encodeURIComponent(currentUser)}`, {
        method: "DELETE",
      });

      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompletion = async (task) => {
    try {
      const response = await fetch(`${TASKS_API}/${task.id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser,
        }),
      });

      const updatedTask = await response.json();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? normalizeTask(updatedTask) : t
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return tasks
      .filter((task) => task.title.toLowerCase().includes(query))
      .filter((task) => {
        if (filter === FILTERS.ACTIVE) return !task.completed;
        if (filter === FILTERS.COMPLETED) return task.completed;
        return true;
      });
  }, [tasks, searchQuery, filter]);

  const sortedTasks = useMemo(() => {
    const copy = [...filteredTasks];

    if (sortOrder === SORTS.TITLE) {
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortOrder === SORTS.OLDEST) {
      return copy.reverse();
    }

    return copy;
  }, [filteredTasks, sortOrder]);

  if (!currentUser) {
    return (
      <div className="App">
        <div className="auth-card">
          <h1>{isSigningUp ? "Create Account" : "Login"}</h1>

          {authError && <div className="error-banner">{authError}</div>}

          <form onSubmit={isSigningUp ? handleSignup : handleLogin}>
            {isSigningUp && (
              <>
                <input
                  type="text"
                  placeholder="First Name"
                  value={authFirstName}
                  onChange={(e) => setAuthFirstName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Last Name"
                  value={authLastName}
                  onChange={(e) => setAuthLastName(e.target.value)}
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />

            <button type="submit">
              {isSigningUp ? "Sign Up" : "Login"}
            </button>

            <button
              type="button"
              onClick={() => setIsSigningUp(!isSigningUp)}
            >
              {isSigningUp ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-shell">
        <div className="app-card">
          <header className="hero">
            <h1>Todo App</h1>

            <div className="user-panel">
              <span>{currentUser}</span>

              <button onClick={handleLogout}>Logout</button>
            </div>
          </header>

          <div className="controls-row">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add task"
            />

            <button onClick={editId ? updateTask : addTask}>
              {editId ? "Update" : "Add"}
            </button>
          </div>

          <div className="controls-row">
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <button onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {loading && <p>Loading...</p>}

          {error && <div>{error}</div>}

          <div className="task-list">
            {sortedTasks.map((task) => (
              <div key={task.id} className="task-item">
                <button onClick={() => toggleCompletion(task)}>
                  {task.completed ? "✅" : "⭕"}
                </button>

                <div className="task-title">{task.title}</div>

                <button
                  onClick={() => {
                    setEditId(task.id);
                    setTitle(task.title);
                  }}
                >
                  Edit
                </button>

                <button onClick={() => deleteTask(task.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```


