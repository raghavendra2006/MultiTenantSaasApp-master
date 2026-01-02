import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get tenant info
      if (user?.tenant) {
        const tenantRes = await api.get(`/tenants/${user.tenant.id}`);
        if (tenantRes.data.success) {
          setStats((prev) => ({
            ...prev,
            totalProjects: tenantRes.data.data.stats.totalProjects,
            totalTasks: tenantRes.data.data.stats.totalTasks,
          }));
        }
      }

      // Get projects
      const projectsRes = await api.get("/projects?limit=5");
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data.projects);
      }

      // Get my tasks
      const tasksRes = await api.get(`/projects?limit=100`);
      if (tasksRes.data.success) {
        setMyTasks([]);
      }

      // Calculate completed and pending tasks
      let completed = 0,
        pending = 0;
      projects.forEach((project) => {
        completed += project.completedTaskCount;
        pending += project.taskCount - project.completedTaskCount;
      });

      setStats((prev) => ({
        ...prev,
        completedTasks: completed,
        pendingTasks: pending,
      }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div
      className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500 hover:shadow-lg transition-all hover:-translate-y-1 duration-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-2">{value}</p>
        </div>
        <div className={`text-4xl text-${color}-500 bg-${color}-50 p-3 rounded-full opacity-90`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Welcome back, <span className="font-semibold text-indigo-600">{user?.fullName}</span>
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            icon="📊"
            label="Total Projects"
            value={stats.totalProjects}
            color="indigo"
          />
          <StatCard
            icon="✅"
            label="Completed Tasks"
            value={stats.completedTasks}
            color="emerald"
          />
          <StatCard
            icon="⏳"
            label="Pending Tasks"
            value={stats.pendingTasks}
            color="amber"
          />
          <StatCard
            icon="📈"
            label="Total Tasks"
            value={stats.totalTasks}
            color="violet"
          />
        </div>

        {/* Recent Projects & Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Projects Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                  Recent Projects
                </h2>
                <Link
                  to="/projects"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1 transition-colors"
                >
                  View All <span>→</span>
                </Link>
              </div>

              {loading ? (
                <div className="text-center text-slate-400 py-12 animate-pulse font-medium">Loading dashboard data...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p className="mb-4 text-slate-500">No projects found</p>
                  <Link
                    to="/projects"
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Create your first project →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block p-5 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:shadow-md hover:bg-slate-50 transition-all duration-200 group"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {project.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                project.status === "active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {project.status}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              <span className="text-slate-800 font-bold">{project.completedTaskCount}</span> / {project.taskCount}{" "}
                              tasks completed
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 p-8 border border-slate-100 h-full">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Quick Actions
              </h2>
              <div className="space-y-4">
                <Link
                  to="/projects"
                  className="block w-full bg-indigo-600 text-white text-center py-3.5 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all transform hover:-translate-y-0.5 font-bold tracking-wide"
                >
                  + New Project
                </Link>
                <Link
                  to="/projects"
                  className="block w-full bg-white border-2 border-slate-200 text-slate-700 text-center py-3 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all font-semibold"
                >
                  View All Projects
                </Link>
                {user?.role === "tenant_admin" && (
                  <Link
                    to="/users"
                    className="block w-full bg-fuchsia-600 text-white text-center py-3 rounded-lg hover:bg-fuchsia-700 shadow-md shadow-fuchsia-200 transition-all transform hover:-translate-y-0.5 font-semibold"
                  >
                    Manage Users
                  </Link>
                )}
              </div>

              {/* User Info Card */}
              <div className="mt-8 p-5 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border border-indigo-100">
                <h3 className="font-bold text-slate-800 mb-3 border-b border-indigo-200 pb-2">Current Session</h3>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-medium text-slate-800 truncate ml-2">{user?.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Role:</span>
                        <span className="font-medium text-indigo-600 capitalize">{user?.role?.replace('_', ' ')}</span>
                    </div>
                    {user?.tenant && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Org:</span>
                            <span className="font-medium text-slate-800">{user.tenant.name}</span>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;