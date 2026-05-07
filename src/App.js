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
      background: "linear-gradient(to right, #1e293b, #0f172a)",
      padding: "40px",
      fontFamily: "Arial",
    }}
  >
    <div
      style={{
        maxWidth: "700px",
        margin: "auto",
        background: "white",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#0f172a",
          marginBottom: "30px",
        }}
      >
        Todo App 🚀
      </h1>

      {/* INPUT SECTION */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Enter task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />

        <button
          onClick={editId ? updateTask : addTask}
          style={{
            background: editId ? "#f59e0b" : "#0f172a",
            color: "white",
            border: "none",
            padding: "14px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
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
              background: "#f8fafc",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                color: "#0f172a",
                fontWeight: "500",
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
                  background: "#8678f5",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✏️ Update
              </button>

              {/* DELETE BUTTON */}
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  background: "#8f6d06df",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ❌ Delete
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