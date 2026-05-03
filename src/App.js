import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [editId, setEditId] = useState(null);


  const API = "http://127.0.0.1:60991/tasks";

  // GET TASKS
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });

    setTitle("");
    fetchTasks();
  };

  const updateTask = async () => {
  await fetch(`${API}/${editId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });

  setTitle("");
  setEditId(null);
  fetchTasks();
};

  // DELETE TASK
  const deleteTask = async (id) => {
    await fetch(`${API}/${id}`, {
      method: "DELETE"
    });

    fetchTasks();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Todo App 🚀</h1>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task"
      />

    <button onClick={editId ? updateTask : addTask}>
  {editId ? "Update Task" : "Add Task"}
      </button>

      <ul>
    {tasks.map((t) => (
  <li key={t.id}>
    {t.title}

    <button onClick={() => {
      setEditId(t.id);
      setTitle(t.title);
    }}>
      ✏️ Edit
    </button>

    <button onClick={() => deleteTask(t.id)}>
      ❌ Delete
    </button>
  </li>
))}
      </ul>
    </div>
  );
}

export default App;
