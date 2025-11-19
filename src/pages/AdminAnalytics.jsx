import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import AdminCard from '../components/AdminCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

// Register the necessary Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

const AdminAnalytics = () => {
    const loading = false;
    const error = null;
    const overviewData = {
        activeUsers: 1200,
        newSignups: 45,
        revenue: 3200,
        categories: { Food: 40, Travel: 30, Shopping: 20, Other: 10 },
    };

    if (loading) return <Loader text="Fetching analytics..." />;
    if (error) return <ErrorMessage error={error} />;

    const categoryData = {
        labels: Object.keys(overviewData.categories),
        datasets: [
            {
                data: Object.values(overviewData.categories),
                backgroundColor: ['#00d4ff', '#009bb3', '#7dd3fc', '#bae6fd'],
            },
        ],
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AdminCard title="Active Users">
                    <div className="text-3xl font-bold text-primary">{overviewData.activeUsers}</div>
                </AdminCard>
                <AdminCard title="New Signups">
                    <div className="text-3xl font-bold text-primary">{overviewData.newSignups}</div>
                </AdminCard>
                <AdminCard title="Revenue">
                    <div className="text-3xl font-bold text-primary">${overviewData.revenue}</div>
                </AdminCard>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-2xl font-semibold mb-4">Category Breakdown</h2>
                <div style={{ height: '400px' }}>
                    <Pie data={categoryData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </div>
        </>
    );
};

export default AdminAnalytics;