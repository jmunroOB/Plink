import React from 'react';

const ErrorMessage = ({ error }) => {
  return (
    <div className="flex items-center justify-center p-8 text-red-600">
      <p className="font-medium text-center">Error: {error}</p>
    </div>
  );
};

export default ErrorMessage;