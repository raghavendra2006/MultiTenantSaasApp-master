import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    assignedTo: "",
    dueDate: "",
  });
  const [tenantUsers, setTenantUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "" });

  useEffect(() => {
    fetchProjectData();
  }, [projectId, filters]);

  useEffect(() => {
    if (user?.tenantId) {
      fetchTenantUsers();
    }
  }, [user]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);

      const tasksRes = await api.get(
        `/projects/${projectId}/tasks?${params.toString()}`
      );
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data.tasks);
      }
    } catch (error) {
      setError("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantUsers = async () => {
    try {
      const response = await api.get(
        `/tenants/${user.tenantId}/users?limit=100`
      );
      if (response.data.success) {
        setTenantUsers(response.data.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskForm);
      if (response.data.success) {
        setSuccess("Task created successfully");
        setTasks([response.data.data, ...tasks]);
        setTaskForm({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
          assignedTo: "",
          dueDate: "",
        });
        setShowTaskModal(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        setTasks(
          tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        setSuccess("Task updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
      setSuccess("Task deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "in_progress":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "todo":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (loading && !tasks.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-500 font-medium">Loading project tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/projects"
          className="group flex items-center text-indigo-600 hover:text-indigo-800 mb-8 transition-colors font-medium text-sm"
        >
          <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span> 
          Back to Projects
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Project Tasks
              </h1>
              <p className="text-slate-500 mt-1 text-lg">
                Manage and track progress for this project
              </p>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 font-bold flex items-center gap-2"
            >
              <span className="text-xl">+</span> New Task
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-600"></span>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3">
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-600"></span>
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex gap-4 flex-wrap items-center">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-2 mr-2">Filters:</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
          >
            <option value="">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="text-center py-20 bg-white">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-slate-500 font-medium text-lg mb-4">No tasks found matching your filters</p>
              <button
                onClick={() => setShowTaskModal(true)}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline underline-offset-4"
              >
                Create your first task →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Task Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned To</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                            {task.title}
                          </p>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleUpdateTaskStatus(task.id, e.target.value)
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-200 outline-none transition-all ${getStatusColor(
                            task.status
                          )}`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {task.assignedTo?.fullName?.charAt(0) || "?"}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                {task.assignedTo?.fullName || "Unassigned"}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-400 hover:text-rose-600 font-bold text-sm transition-colors p-2 hover:bg-rose-50 rounded-lg"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                    Create New Task
                </h2>
                <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe the work to be done..."
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none"
                    rows="3"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, priority: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dueDate: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Assign To
                  </label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, assignedTo: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  >
                    <option value="">Unassigned</option>
                    {tenantUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold transition-all transform hover:-translate-y-0.5"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;