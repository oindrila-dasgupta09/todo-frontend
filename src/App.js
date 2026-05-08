import { useCallback, useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState(null);

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

  const normalizeTask = useCallback((task) => {
    const fallbackFromId = getTaskIdDate(task.id);
    const createdAt = task.createdAt || fallbackFromId;
    const updatedAt = task.updatedAt || createdAt || fallbackFromId;
    return { ...task, createdAt, updatedAt };
  }, [getTaskIdDate]);

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

  // FETCH TASKS
  const fetchTasks = useCallback(async () => {
    const res = await fetch(TASKS_API);
    const data = await res.json();
    const normalized = Array.isArray(data) ? data.map(normalizeTask) : [];
    setTasks(normalized);
  }, [TASKS_API, normalizeTask]);

  // FETCH ACTIVITY
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

  const visibleActivities =
    activities.length > 0 ? activities : buildFallbackActivities(tasks);

  // ADD TASK
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

    setTitle("");
    await fetchTasks();
    await fetchActivities();
  };

  // UPDATE TASK
  const updateTask = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    await fetch(`${TASKS_API}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: cleanTitle }),
    });

    setTitle("");
    setEditId(null);
    await fetchTasks();
    await fetchActivities();
  };

  // DELETE TASK
  const deleteTask = async (id) => {
    await fetch(`${TASKS_API}/${id}`, {
      method: "DELETE",
    });

    await fetchTasks();
    await fetchActivities();
  };

  
return (
  <div
    style={{
      minHeight: "100vh",
      background:
        "radial-gradient(circle at 15% 15%, #e8d5e5 0%, #d9d7f2 35%, #ccd9f5 70%, #dce3ec 100%)",
      padding: "36px 16px",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    }}
  >
    <div
      style={{
        maxWidth: "760px",
        margin: "auto",
        background: "#ffffff",
        borderRadius: "18px",
        padding: "30px",
        border: "1px solid #e8eafc",
        boxShadow: "0 16px 36px rgba(99, 102, 241, 0.08)",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#0b1220",
          margin: "8px 0 6px",
          letterSpacing: "0.2px",
          fontSize: "2rem",
        }}
      >
        Todo App
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "#475569",
          margin: "0 0 26px",
          fontSize: "0.98rem",
        }}
      >
        Stay organized with a clean, focused workspace.
      </p>

      {/* INPUT SECTION */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "22px" }}>
        <input
          type="text"
          placeholder="Enter task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            fontSize: "16px",
            outline: "none",
            background: "#ffffff",
            color: "#0f172a",
            boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.06)",
          }}
        />

        <button
          onClick={editId ? updateTask : addTask}
          style={{
            background: editId ? "#475569" : "#0f172a",
            color: "white",
            border: "none",
            padding: "14px 22px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "700",
            minWidth: "120px",
            boxShadow: "0 8px 16px rgba(15, 23, 42, 0.16)",
          }}
        >
          {editId ? "Update" : "Add"}
        </button>
      </div>

      {/* TASK LIST */}
      <div>
        <h3 style={{ color: "#334155", marginBottom: "14px" }}>
          All Tasks ({tasks.length})
        </h3>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              background: "#ffffff",
              padding: "16px",
              borderRadius: "14px",
              marginBottom: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: "1px solid #e2e8f0",
              boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            }}
          >
            <div style={{ paddingRight: "12px" }}>
              <div
                style={{
                  fontSize: "17px",
                  color: "#1e293b",
                  fontWeight: "600",
                  wordBreak: "break-word",
                }}
              >
                {task.title}
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Added: {formatTime(task.createdAt)} | Updated:{" "}
                {formatTime(task.updatedAt)}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {/* UPDATE BUTTON */}
              <button
                onClick={() => {
                  setEditId(task.id);
                  setTitle(task.title);
                }}
                style={{
                  background: "#334155",
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  boxShadow: "0 6px 14px rgba(51, 65, 85, 0.18)",
                }}
              >
                Update
              </button>

              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "700",
                  boxShadow: "0 6px 14px rgba(220, 38, 38, 0.18)",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <h3 style={{ color: "#334155", marginBottom: "14px" }}>
          Recent Activity
        </h3>
        {!visibleActivities.length && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            No activity yet.
          </div>
        )}
        {visibleActivities.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "10px",
              color: "#334155",
              fontSize: "14px",
            }}
          >
            <strong>{item.title}</strong> was <strong>{item.type}</strong> at{" "}
            {formatTime(item.timestamp)}
          </div>
        ))}
      </div>
    </div>
  </div>
);

}

export default App;