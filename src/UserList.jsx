import React, { useState, useEffect } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Make a GET request to the backend endpoint
                const response = await fetch('http://localhost:5000/api/users');

                // Check if the response was successful
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Parse the JSON data from the response
                const userData = await response.json();
                
                // Update the state with the fetched data
                setUsers(userData);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []); // The empty array ensures this effect runs only once

    if (loading) return <p>Loading users...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <h1>User List from Backend</h1>
            <ul>
                {users.map(user => (
                    <li key={user.uid}>{user.email || 'No email provided'}</li>
                ))}
            </ul>
        </div>
    );
}

export default UserList;