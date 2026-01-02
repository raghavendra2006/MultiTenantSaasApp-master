import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const Tenants = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTenants: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    status: "",
    subscriptionPlan: "",
    search: "",
  });
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    name: "",
    status: "",
    subscriptionPlan: "",
    maxUsers: "",
    maxProjects: "",
  });

  // Fetch tenants
  const fetchTenants = async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.subscriptionPlan)
        params.append("subscriptionPlan", filters.subscriptionPlan);

      const url = `/tenants?${params}`;
      const response = await api.get(url);

      if (response.data.success) {
        setTenants(response.data.data.tenants);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to fetch tenants. Make sure you're logged in as super_admin.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle tenant update
  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: updateFormData.name || selectedTenant.name,
        status: updateFormData.status || selectedTenant.status,
        subscriptionPlan:
          updateFormData.subscriptionPlan || selectedTenant.subscriptionPlan,
      };

      if (updateFormData.maxUsers)
        updateData.maxUsers = parseInt(updateFormData.maxUsers);
      if (updateFormData.maxProjects)
        updateData.maxProjects = parseInt(updateFormData.maxProjects);

      const response = await api.put(
        `/tenants/${selectedTenant.id}`,
        updateData
      );

      if (response.data.success) {
        alert("Tenant updated successfully!");
        setShowUpdateModal(false);
        fetchTenants(pagination.currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update tenant");
    }
  };

  // Open update modal
  const openUpdateModal = (tenant) => {
    setSelectedTenant(tenant);
    setUpdateFormData({
      name: tenant.name,
      status: tenant.status,
      subscriptionPlan: tenant.subscriptionPlan,
      maxUsers: tenant.maxUsers,
      maxProjects: tenant.maxProjects,
    });
    setShowUpdateModal(true);
  };

  // Load tenants on mount or when filters change
  useEffect(() => {
    fetchTenants(1);
  }, [filters]);

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchTenants(1);
    }
  }, []);

  if (!user || user.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            🔒
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">
            Access Denied
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            This administrative area is restricted. Only super admins can manage tenants.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Tenant Management
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Monitor and control all organizations within the ecosystem.
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Filter Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-slate-700 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="trial">Trial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Subscription Plan
              </label>
              <select
                value={filters.subscriptionPlan}
                onChange={(e) => setFilters({ ...filters, subscriptionPlan: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all text-slate-700 font-medium"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: "", subscriptionPlan: "", search: "" })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Reset Filters
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchTenants(1)}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh List"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-400 font-medium">Loading tenants...</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="text-5xl mb-6">🏢</div>
            <p className="text-slate-800 text-xl font-bold mb-2">No tenants found</p>
            <p className="text-slate-500">Try adjusting your filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subdomain</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Usage</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{tenant.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ID: {tenant.id.slice(0,8)}...</p>
                      </td>
                      <td className="px-6 py-5">
                        <code className="bg-slate-100 text-indigo-600 px-2 py-1 rounded text-xs font-bold">
                          {tenant.subdomain}
                        </code>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          tenant.status === "active" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-indigo-100">
                          {tenant.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-slate-600">Users: <b className="text-slate-900">{tenant.totalUsers || 0}</b></span>
                            <span className="text-xs font-medium text-slate-600">Projects: <b className="text-slate-900">{tenant.totalProjects || 0}</b></span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right space-x-3">
                        <button
                          onClick={() => openUpdateModal(tenant)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => navigate(`/tenants/${tenant.id}/users`)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors"
                        >
                          Users
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
                <p className="text-sm font-medium text-slate-500">
                  Page <span className="text-slate-900 font-bold">{pagination.currentPage}</span> of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchTenants(Math.max(1, pagination.currentPage - 1))}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchTenants(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedTenant && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
                Update Tenant
              </h2>

              <form onSubmit={handleUpdateTenant} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tenant Name</label>
                  <input
                    type="text"
                    value={updateFormData.name}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                        <select
                            value={updateFormData.status}
                            onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="trial">Trial</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Plan</label>
                        <select
                            value={updateFormData.subscriptionPlan}
                            onChange={(e) => setUpdateFormData({ ...updateFormData, subscriptionPlan: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                        >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Users</label>
                        <input
                            type="number"
                            value={updateFormData.maxUsers}
                            onChange={(e) => setUpdateFormData({ ...updateFormData, maxUsers: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Projects</label>
                        <input
                            type="number"
                            value={updateFormData.maxProjects}
                            onChange={(e) => setUpdateFormData({ ...updateFormData, maxProjects: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-100"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
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

export default Tenants;