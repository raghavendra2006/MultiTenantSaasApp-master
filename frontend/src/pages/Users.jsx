import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ role: "", search: "" });

  useEffect(() => {
    if (user?.role === "tenant_admin") {
      fetchUsersTenant();
    } else if (user?.role === "super_admin") {
      fetchUsersAll();
    }
  }, [filters, user]);

  const fetchUsersTenant = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `/tenants/${user.tenantId}/users?${params.toString()}`
      );
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAll = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/users?${params.toString()}`);
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.fullName || !formData.password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(
        `/tenants/${user.tenantId}/users`,
        formData
      );
      if (response.data.success) {
        setSuccess("User created successfully");
        setUsers([response.data.data, ...users]);
        setFormData({ email: "", fullName: "", password: "", role: "user" });
        setShowModal(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      setSuccess("User deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (user?.role !== "tenant_admin" && user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-red-600 font-semibold">
            You do not have permission to access this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Users Management
            </h1>
            <p className="text-gray-600 mt-2">
              {user?.role === "super_admin"
                ? "Monitor all users across tenants"
                : "Manage your organization's team members"}
            </p>
          </div>
          {user?.role === "tenant_admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Add User
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No users found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Add your first user →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {u.fullName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === "tenant_admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {u.role === "tenant_admin" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {u.id !== user.id && user?.role === "tenant_admin" && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && user?.role === "tenant_admin" && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Add New User
              </h2>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="tenant_admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Add User
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

export default Users;
