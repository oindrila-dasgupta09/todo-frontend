import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
const AUTH_API_URL = `${API_BASE_URL}/auth`;
const TASKS_API_URL = `${API_BASE_URL}/tasks`;

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const [editId, setEditId] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [isSignup, setIsSignup] = useState(false);

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("user") || ""
  );

  

  // =========================
  // FETCH TASKS
  // =========================

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(TASKS_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      );

      const data = await response.json();
      console.log("TASKS =", data);

      if (data.success) {
  setTasks(data.tasks);
}
      

    } catch (error) {
      console.log(error);
    }
  }, [token]);
  

  // =========================
  // AUTO LOAD TASKS
  // =========================

  useEffect(() => {
    if (token) {

      fetchTasks();

      //const interval = setInterval(() => {
     //   fetchTasks();
     // }, 3000);

      //return () => clearInterval(interval);
    }
  }, [token, fetchTasks]);

  // =========================
  // SIGNUP
  // =========================

  
const handleSignup = async () => {
  try {

    const response = await fetch(
      `${AUTH_API_URL}/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    if (data.success) {

      alert("Signup successful");

      setIsSignup(false);

      setFirstName("");
      setLastName("");

    } else {
      alert(data.message);
    }

  } catch (error) {
    console.log(error);
  }
};



  // =========================
  // LOGIN
  // =========================

  
const handleLogin = async () => {
  try {

    const response = await fetch(
      `${AUTH_API_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    if (data.success) {

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        data.user.email
      );

      setToken(data.token);

      setCurrentUser(
        data.user.email
      );

    } else {
      alert(data.message);
    }

  } catch (error) {
    console.log(error);
  }
};

  

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setCurrentUser("");

    setTasks([]);
  };

  // =========================
  // ADD TASK
  // =========================



const addTask = async () => {

  if (!title.trim()) return;

  try {

    // ======================
    // UPDATE TASK
    // ======================

    if (editId) {

      const response = await fetch(
        `${TASKS_API_URL}/${editId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.success) {
        setTitle("");
        setEditId(null);
        fetchTasks();
      }

    }

    // ======================
    // CREATE TASK
    // ======================

    else {

      const response = await fetch(
        TASKS_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
          }),
        }
      );

      const data = await response.json();

      console.log(data);

      if (data.success) {
        setTitle("");
        fetchTasks();
      }

    }

  } catch (error) {
    console.log(error);
  }
};




  // =========================
  // DELETE TASK
  // =========================

  const deleteTask = async (id) => {
    try {
      await fetch(
        `${TASKS_API_URL}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // TOGGLE COMPLETE
  // =========================

  const toggleTask = async (task) => {
    try {
      await fetch(
        `${TASKS_API_URL}/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: task.title,
            completed: !task.completed,
          }),
        }
      );

      fetchTasks();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // COUNTS
  // =========================

  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.completed).length;
  }, [tasks]);

  const activeCount = tasks.length - completedCount;

  // =========================
  // UI
  // =========================

  if (!token) {
    return (
      <div className="App">
        <div className="app-shell">
          <div className="app-card">

            
          
<h1>Todo App</h1>

{isSignup && (
  <>
    <input
      type="text"
      placeholder="First Name"
      value={firstName}
      onChange={(e) =>
        setFirstName(e.target.value)
      }
      className="search-input"
    />

    <input
      type="text"
      placeholder="Last Name"
      value={lastName}
      onChange={(e) =>
        setLastName(e.target.value)
      }
      className="search-input"
    />
  </>
)}

<input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) =>
    setEmail(e.target.value)
  }
  className="search-input"
/>

<input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) =>
    setPassword(e.target.value)
  }
  className="search-input"
/>

<div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  }}
>

  {isSignup ? (
    <>
      <button
        className="button primary-button"
        onClick={handleSignup}
      >
        Signup
      </button>

      <button
        className="button secondary-button"
        onClick={() =>
          setIsSignup(false)
        }
      >
        Login
      </button>
    </>
  ) : (
    <>
      <button
        className="button primary-button"
        onClick={handleLogin}
      >
        Login
      </button>

      <button
        className="button secondary-button"
        onClick={() =>
          setIsSignup(true)
        }
      >
        Signup
      </button>
    </>
  )}

</div>      

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-shell">
        <div className="app-card">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1>Todo App</h1>
              <p>{currentUser}</p>
            </div>

            <button
              className="button secondary-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span>Total</span>
              <strong>{tasks.length}</strong>
            </article>

            <article className="stat-card">
              <span>Active</span>
              <strong>{activeCount}</strong>
            </article>

            <article className="stat-card">
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </article>
          </div>

          <div className="controls-row">
            <input
              type="text"
              placeholder="Add task..."
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="search-input"
            />

            <button
              className="button primary-button"
              onClick={addTask}
            >
              {editId ? "Update Task" : "Add Task"}
            </button>
          </div>

          <div className="task-list">

            {tasks.map((task) => (
              <div
                key={task.id}
                className="task-item"
              >

                <div className="task-meta">
                  <label className="task-meta">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task)}
                    />

                    <span
                      style={{
                        textDecoration:
                          task.completed
                            ? "line-through"
                            : "none",
                      }}
                    >
                      {task.title}
                    </span>
                  </label>
                </div>

                <div className="task-actions">

  <button
    className="task-btn update-btn"
    onClick={() => {
      setEditId(task.id);
      setTitle(task.title);
    }}
  >
    Update
  </button>

  <button
    className="task-btn delete-btn"
    onClick={() =>
      deleteTask(task.id)
    }
  >
    Delete
  </button>

</div>



              </div>
            ))}

          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
