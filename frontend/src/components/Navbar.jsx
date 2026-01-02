import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="font-bold text-blue-600">GPP</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">
              SaaS Platform
            </span>
          </Link>

          {/* Menu Items (Always Visible) */}
          <div className="flex space-x-8">
            <Link
              to="/dashboard"
              className="text-white hover:text-blue-200 transition"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="text-white hover:text-blue-200 transition"
            >
              Projects
            </Link>
            {(user?.role === "tenant_admin" ||
              user?.role === "super_admin") && (
              <Link
                to="/users"
                className="text-white hover:text-blue-200 transition"
              >
                Users
              </Link>
            )}
            {user?.role === "super_admin" && (
              <Link
                to="/tenants"
                className="text-white hover:text-blue-200 transition"
              >
                Tenants
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <span className="hidden sm:inline">
                {user?.fullName || "User"}
              </span>
              <span className="text-xs">{user?.role}</span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
