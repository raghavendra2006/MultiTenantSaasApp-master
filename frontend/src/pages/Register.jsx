import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    tenantName: "",
    subdomain: "",
    adminEmail: "",
    adminFullName: "",
    adminPassword: "",
    confirmPassword: "",
    terms: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerTenant } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.tenantName.trim()) return "Organization name is required";
    if (!formData.subdomain.trim()) return "Subdomain is required";
    if (
      !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(formData.subdomain) ||
      formData.subdomain.length < 3
    ) {
      return "Invalid subdomain format";
    }
    if (!formData.adminEmail.includes("@")) return "Invalid email format";
    if (!formData.adminFullName.trim()) return "Full name is required";
    if (formData.adminPassword.length < 8)
      return "Password must be at least 8 characters";
    if (formData.adminPassword !== formData.confirmPassword)
      return "Passwords do not match";
    if (!formData.terms) return "You must accept terms and conditions";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await registerTenant(
        formData.tenantName,
        formData.subdomain,
        formData.adminEmail,
        formData.adminPassword,
        formData.adminFullName
      );

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center rotate-3 hover:rotate-6 transition-transform">
            <span className="text-white font-bold text-xl">G</span>
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Create Organization
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Start your SaaS journey with a professional workspace
          </p>
        </div>

        {/* Feedback Messages */}
        <div className="px-8">
            {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {error}
            </div>
            )}

            {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4.007-5.509z" clipRule="evenodd" />
                </svg>
                {success}
            </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="px-8 space-y-6">
          
          {/* Organization Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Workspace Info</h3>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Name</label>
                <input
                type="text"
                name="tenantName"
                value={formData.tenantName}
                onChange={handleChange}
                className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                placeholder="Apex Industries"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Workspace Subdomain</label>
                <div className="flex group">
                    <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleChange}
                        className="block flex-1 rounded-l-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                        placeholder="apex"
                    />
                    <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-medium">
                        .saasapp.com
                    </span>
                </div>
            </div>
          </div>

          {/* Admin Details Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Admin Account</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        name="adminFullName"
                        value={formData.adminFullName}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input
                        type="email"
                        name="adminEmail"
                        value={formData.adminEmail}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                        placeholder="admin@apex.com"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <input
                        type="password"
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                        placeholder="••••••••"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm"
                        placeholder="••••••••"
                    />
                </div>
            </div>
          </div>

          {/* Terms and Submit */}
          <div className="space-y-6 pb-4">
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 bg-slate-50"
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label className="text-slate-600">
                        I agree to the <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">Terms & Conditions</span> and Privacy Policy
                    </label>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
            >
                {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Up...
                </span>
                ) : (
                "Create Workspace"
                )}
            </button>
          </div>
        </form>

        <div className="mt-2 text-center pb-8">
          <p className="text-sm text-slate-500">
            Already have an organization?{" "}
            <Link
              to="/login"
              className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;