import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    tenantSubdomain: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Subdomain is optional for super admin
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password, formData.tenantSubdomain);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      tenantSubdomain: "demo",
      email: "admin@demo.com",
      password: "Demo@123",
    });
    setError("");
  };

  const fillSuperAdminCredentials = () => {
    setFormData({
      tenantSubdomain: "",
      email: "superadmin@system.com",
      password: "Admin@123",
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center rotate-3 hover:rotate-6 transition-transform">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please enter your details to sign in
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-8 mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="px-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Subdomain <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              name="tenantSubdomain"
              value={formData.tenantSubdomain}
              onChange={handleChange}
              className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none placeholder:text-slate-400 sm:text-sm sm:leading-6"
              placeholder="company"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none placeholder:text-slate-400 sm:text-sm sm:leading-6"
              placeholder="admin@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none placeholder:text-slate-400 sm:text-sm sm:leading-6"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md shadow-indigo-200 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 text-center pb-6">
          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Developer / Demo Quick Access Section */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
            Quick Access (Dev Mode)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200"
            >
              <span className="text-xs font-semibold text-slate-700 group-hover:text-indigo-600">Demo Admin</span>
              <span className="text-[10px] text-slate-400 mt-1">admin@demo.com</span>
            </button>

            <button
              type="button"
              onClick={fillSuperAdminCredentials}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white hover:border-fuchsia-300 hover:shadow-md transition-all duration-200"
            >
              <span className="text-xs font-semibold text-slate-700 group-hover:text-fuchsia-600">Super Admin</span>
              <span className="text-[10px] text-slate-400 mt-1">super@system.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;