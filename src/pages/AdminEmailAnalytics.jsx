import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';

const AdminEmailAnalytics = () => {
    const { apiFetch } = useContext(AppContext);
    const [analytics, setAnalytics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('monthly');
    const [expandedEmail, setExpandedEmail] = useState(null);

    const fetchAnalytics = async (filter) => {
        try {
            setLoading(true);
            const response = await apiFetch(`/admin/email/analytics?timeFilter=${filter}`);
            if (!response.ok) {
                throw new Error('Failed to fetch email analytics.');
            }
            const data = await response.json();
            setAnalytics(data.analytics);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(timeFilter);
    }, [timeFilter]);

    if (loading) return <Loader text="Loading email analytics..." />;
    if (error) return <ErrorMessage error={error} />;

    const toggleExpand = (emailId) => {
        setExpandedEmail(expandedEmail === emailId ? null : emailId);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Email Analytics</h1>
                <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="p-2 border rounded-md"
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                </select>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipients</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.length > 0 ? (
                            analytics.map(email => (
                                <React.Fragment key={email.id}>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{email.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(email.sentDate).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{email.recipientsType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => toggleExpand(email.id)} className="text-blue-600 hover:text-blue-900">
                                                {expandedEmail === email.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedEmail === email.id && (
                                        <tr>
                                            <td colSpan="4" className="p-4 bg-gray-50">
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                                    <div>
                                                        <div className="text-xl font-bold text-gray-800">{email.metrics.sent}</div>
                                                        <div className="text-xs text-gray-500">Emails Sent</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold text-green-500">{email.metrics.opens_rate}%</div>
                                                        <div className="text-xs text-gray-500">Open Rate</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold text-blue-500">{email.metrics.clicks_rate}%</div>
                                                        <div className="text-xs text-gray-500">Click Rate</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold text-red-500">{email.metrics.bounces}</div>
                                                        <div className="text-xs text-gray-500">Bounces</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-bold text-red-500">{email.metrics.unsubscribes}</div>
                                                        <div className="text-xs text-gray-500">Unsubscribes</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No emails found for this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminEmailAnalytics;