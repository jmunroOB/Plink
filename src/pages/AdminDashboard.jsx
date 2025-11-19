import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

import AdminAnalytics from './AdminAnalytics';
import AdminLocations from './AdminLocations';
import AdminCRM from './AdminCRM';
import AdminEmail from './AdminEmail';
import AdminSettings from './AdminSettings';
import AdminEmailAnalytics from './AdminEmailAnalytics';

const AdminDashboard = () => {
    return (
        <AdminLayout>
            <Routes>
                <Route index element={<Navigate to="analytics" replace />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="locations" element={<AdminLocations />} />
                <Route path="crm" element={<AdminCRM />} />
                <Route path="email" element={<AdminEmail />} />
                <Route path="email-analytics" element={<AdminEmailAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminDashboard;