import React from 'react';

const AdminCard = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default AdminCard;