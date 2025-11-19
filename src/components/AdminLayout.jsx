import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, Mail, Settings, BarChart2, LogOut } from 'lucide-react';

const AdminLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-800">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white p-4 space-y-4 flex flex-col sticky top-0 h-screen">
                <div className="flex items-center justify-center h-20">
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                </div>
                <nav className="flex-1 space-y-2">
                    <NavLink
                        to="/admin/analytics"
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md transition-colors duration-200 ${
                                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Analytics
                    </NavLink>
                    <NavLink
                        to="/admin/locations"
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md transition-colors duration-200 ${
                                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        <MapPin className="w-5 h-5 mr-2" />
                        Locations
                    </NavLink>
                    <NavLink
                        to="/admin/crm"
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md transition-colors duration-200 ${
                                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        <Users className="w-5 h-5 mr-2" />
                        CRM
                    </NavLink>
                    <NavLink
                        to="/admin/email"
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md transition-colors duration-200 ${
                                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        <Mail className="w-5 h-5 mr-2" />
                        Email
                    </NavLink>
                    <NavLink
                        to="/admin/email-analytics"
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md transition-colors duration-200 ${
                                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        <BarChart2 className="w-5 h-5 mr-2" />
                        Email Analytics
                    </NavLink>
                </nav>
                <div className="mt-auto">
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) =>
                            `flex items-center p-2 rounded-md transition-colors duration-200 ${
                                isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
                            }`
                        }
                    >
                        <Settings className="w-5 h-5 mr-2" />
                        Settings
                    </NavLink>
                    <button
                        onClick={() => {/* handle logout here */}}
                        className="w-full flex items-center p-2 mt-2 rounded-md transition-colors duration-200 hover:bg-red-600 text-red-400"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                    </button>
                </div>
            </div>
            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;