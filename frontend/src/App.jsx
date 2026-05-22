import { useState, useEffect } from "react";
import "./index.css";

// 🔧 Change this to your PythonAnywhere URL when deploying
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/tasks/";

export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [title, setTitle]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter]     = useState("all");
  const [inputErr, setInputErr] = useState("");
  const [modal, setModal]       = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setFetching(false));
  }, []);

  const total     = tasks.length;
  const done      = tasks.filter((t) => t.is_completed).length;
  const remaining = total - done;

  const filtered =
    filter === "done"    ? tasks.filter((t) => t.is_completed)  :
    filter === "pending" ? tasks.filter((t) => !t.is_completed) :
    tasks;

  const handleAdd = async () => {
    const clean = title.trim();
    if (!clean)           { setInputErr("Task title cannot be empty.");    return; }
    if (clean.length > 100) { setInputErr("Max 100 characters allowed."); return; }
    setInputErr("");
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: clean, is_completed: false }),
      });
      if (!res.ok) throw new Error("Server error " + res.status);
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setModal({ type: "success", heading: "Task Created!", sub: "Saved to Django database.", taskTitle: clean });
    } catch (e) {
      setModal({ type: "error", heading: "Failed to Add Task", sub: e.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: !t.is_completed } : t))
    );

  const deleteTask = (id) => {
    setRemoving(id);
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setRemoving(null);
    }, 300);
  };

  return (
    <div className="app-wrap">

      {/* HERO */}
      <header className="hero">
        <div className="hero-badge">Finals Quiz #3</div>
        <h1>Task Manager</h1>
        <p>Django REST API + React Frontend</p>
      </header>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-num">{total}</span>
          <span className="stat-lbl">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-num green">{done}</span>
          <span className="stat-lbl">Done</span>
        </div>
        <div className="stat-card">
          <span className="stat-num amber">{remaining}</span>
          <span className="stat-lbl">Remaining</span>
        </div>
      </div>

      {/* ADD TASK FORM */}
      <div className="form-card">
        <h2 className="card-title">Add New Task</h2>
        <div className="input-row">
          <input
            className={`task-input${inputErr ? " input-error" : ""}`}
            placeholder="What needs to be done?"
            value={title}
            maxLength={100}
            onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setInputErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button className="btn-add" onClick={handleAdd} disabled={loading}>
            {loading ? <span className="spinner" /> : "+ Add"}
          </button>
        </div>
        <div className={`char-count${title.length > 90 ? " over" : title.length > 70 ? " warn" : ""}`}>
          {title.length} / 100
        </div>
        {inputErr && <p className="err-msg">⚠ {inputErr}</p>}
      </div>

      {/* FILTER + LIST */}
      <div className="section-hdr">
        <h2 className="card-title" style={{ marginBottom: 0 }}>Tasks</h2>
        <div className="filter-btns">
          {["all", "pending", "done"].map((f) => (
            <button
              key={f}
              className={`f-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="tasks-list">
        {fetching ? (
          <div className="state-box">
            <span className="spinner large" /> Loading tasks…
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-box empty">
            <div className="empty-icon">◎</div>
            <p>
              {filter === "done"    ? "No completed tasks yet."  :
               filter === "pending" ? "All tasks are done! 🎉"   :
               "Add your first task above."}
            </p>
          </div>
        ) : (
          filtered.map((task, idx) => (
            <div
              key={task.id}
              className={`task-item${task.is_completed ? " done" : ""}${removing === task.id ? " removing" : ""}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <button
                className={`check-btn${task.is_completed ? " checked" : ""}`}
                onClick={() => toggleTask(task.id)}
                title="Toggle complete"
              >
                {task.is_completed && "✓"}
              </button>
              <span className="task-title">{task.title}</span>
              <div className="task-meta">
                <span className={`status-pill ${task.is_completed ? "pill-done" : "pill-pending"}`}>
                  {task.is_completed ? "Done" : "Pending"}
                </span>
                <button className="del-btn" onClick={() => deleteTask(task.id)} title="Delete">
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === "success" ? "✓" : "✕"}
            </div>
            <h3>{modal.heading}</h3>
            {modal.taskTitle && <div className="modal-task-name">"{modal.taskTitle}"</div>}
            <p className="modal-sub">{modal.sub}</p>
            <button className="modal-close" onClick={() => setModal(null)}>Got it</button>
          </div>
        </div>
      )}

    </div>
  );
}