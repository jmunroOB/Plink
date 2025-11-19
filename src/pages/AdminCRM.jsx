import React, { useState } from 'react';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import AdminCard from '../components/AdminCard';

const AdminCRM = () => {
    const [contacts, setContacts] = useState([
        { id: 1, name: "Alice Smith", email: "alice@example.com" },
        { id: 2, name: "Bob Johnson", email: "bob@example.com" }
    ]);
    const loading = false;
    const error = null;

    if (loading) return <Loader />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <AdminCard title="Customer Relationships">
            <table className="w-full table-auto">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map(c => (
                        <tr key={c.id} className="border-t">
                            <td className="px-4 py-2">{c.name}</td>
                            <td className="px-4 py-2">{c.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </AdminCard>
    );
};

export default AdminCRM;