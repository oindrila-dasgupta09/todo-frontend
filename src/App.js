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
    setLoading(true);
    setError("");

    try {
      const res = await fetch(TASKS_API);
      if (!res.ok) throw new Error("Unable to fetch tasks");
      const data = await res.json();
      const normalized = Array.isArray(data) ? data.map(normalizeTask) : [];
      const tasksWithCompletion = normalized.map((task) => ({
        ...task,
        completed: completionMap[task.id] ?? task.completed,
      }));
      setTasks(tasksWithCompletion);
    } catch (err) {
      setError("Unable to load tasks. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [TASKS_API, normalizeTask, completionMap]);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(ACTIVITIES_API);
      if (!res.ok) {
        setActivities([]);
        return;
      }
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivities([]);
    }
  }, [ACTIVITIES_API]);

  useEffect(() => {
    fetchTasks();
    fetchActivities();
  }, [fetchTasks, fetchActivities]);

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

  const addTask = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    await fetch(TASKS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: cleanTitle }),
    });

    resetForm();
    await fetchTasks();
    await fetchActivities();
  };

  const updateTask = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !editId) return;

    await fetch(`${TASKS_API}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: cleanTitle }),
    });

    resetForm();
    await fetchTasks();
    await fetchActivities();
  };

  const deleteTask = async (id) => {
    await fetch(`${TASKS_API}/${id}`, {
      method: "DELETE",
    });

    await fetchTasks();
    await fetchActivities();
  };

  const toggleCompletion = async (task) => {
    const nextCompleted = !task.completed;
    const nextMap = { ...completionMap, [task.id]: nextCompleted };
    saveCompletionMap(nextMap);
    setCompletionMap(nextMap);
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, completed: nextCompleted } : item
      )
    );

    try {
      const res = await fetch(`${TASKS_API}/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: task.title, completed: nextCompleted }),
      });
      if (!res.ok) {
        throw new Error("Unable to update completion");
      }
    } catch {
      setError("Unable to save task completion. It will remain marked locally.");
    }

    await fetchTasks();
    await fetchActivities();
  };

  const clearCompleted = async () => {
    const completedTasks = tasks.filter((task) => task.completed);
    if (completedTasks.length === 0) return;

    const nextMap = { ...completionMap };
    completedTasks.forEach((task) => {
      delete nextMap[task.id];
    });
    saveCompletionMap(nextMap);
    setCompletionMap(nextMap);
    setTasks((current) => current.filter((task) => !task.completed));

    try {
      await Promise.all(
        completedTasks.map((task) =>
          fetch(`${TASKS_API}/${task.id}`, {
            method: "DELETE",
          })
        )
      );
    } catch {
      setError("Unable to clear completed tasks on the server.");
      await fetchTasks();
      await fetchActivities();
      return;
    }

    await fetchTasks();
    await fetchActivities();
  };

  return (
    <div className="App">
      <div className="app-shell">
        <div className="app-card">
          <header className="hero">
            <p className="eyebrow">Modern task management</p>
            <h1>Todo App</h1>
            <p className="hero-copy">
              Keep your day on track with smart search, filters, and built-in activity insights.
            </p>
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
        </div>
      </div>
    </div>
  );
}

export default App;
