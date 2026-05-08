import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState(null);

  const API = "https://todo-app-x6s5.onrender.com/tasks";

  // FETCH TASKS
  const fetchTasks = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ADD TASK
  const addTask = async () => {
    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    fetchTasks();
  };

  // UPDATE TASK
  const updateTask = async () => {
    await fetch(`${API}/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    setEditId(null);
    fetchTasks();
  };

  // DELETE TASK
  const deleteTask = async (id) => {
    await fetch(`${API}/${id}`, {
      method: "DELETE",
    });

    fetchTasks();
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
            <span
              style={{
                fontSize: "17px",
                color: "#1e293b",
                fontWeight: "600",
                paddingRight: "12px",
                wordBreak: "break-word",
              }}
            >
              {task.title}
            </span>

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
    </div>
  </div>
);

}

export default App;