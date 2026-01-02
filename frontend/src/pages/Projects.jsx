import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ status: "", search: "" });

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/projects?${params.toString()}`);
      if (response.data.success) {
        setProjects(response.data.data.projects);
      }
    } catch (error) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/projects", formData);
      if (response.data.success) {
        setSuccess("Project created successfully");
        setProjects([response.data.data, ...projects]);
        setFormData({ name: "", description: "", status: "active" });
        setShowModal(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter((p) => p.id !== projectId));
      setSuccess("Project deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage and monitor your organization's workflow
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 font-bold flex items-center gap-2"
          >
            <span className="text-2xl leading-none">+</span> New Project
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            {success}
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </span>
            <input
              type="text"
              placeholder="Search projects by name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all text-slate-700"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full md:w-48 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-medium text-slate-600 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-400 font-medium">Fetching projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="text-6xl mb-6">📁</div>
            <p className="text-slate-500 text-xl font-medium mb-6">No projects found</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-lg underline underline-offset-8 decoration-2"
            >
              Create your first project →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all group flex flex-col h-full"
              >
                <Link to={`/projects/${project.id}`} className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        project.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : project.status === "archived"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-slate-500 text-sm mb-8 line-clamp-3 leading-relaxed">
                    {project.description || "No description provided for this project."}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {project.createdBy.fullName.charAt(0)}
                        </div>
                        <p className="text-xs font-medium text-slate-400">
                            By <span className="text-slate-700 font-bold">{project.createdBy.fullName}</span>
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-end">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Progress</p>
                        <p className="text-xs font-black text-slate-700">
                            {project.completedTaskCount} / {project.taskCount} Tasks
                        </p>
                    </div>
                    
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${
                            project.taskCount > 0
                                ? (project.completedTaskCount / project.taskCount) * 100
                                : 0
                            }%`,
                        }}
                        ></div>
                    </div>
                  </div>
                </Link>

                {/* Admin Actions */}
                {user?.role === "tenant_admin" && (
                  <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteProject(project.id);
                      }}
                      className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all uppercase tracking-widest"
                    >
                      Delete Project
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-slate-900">
                    Create Project
                </h2>
                <button 
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-3xl leading-none"
                >
                    &times;
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Website Redesign"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="What is this project about?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all resize-none"
                    rows="4"
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Project"}
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

export default Projects;