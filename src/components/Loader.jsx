import React from 'react';

const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      <p className="mt-4 text-center">{text}</p>
    </div>
  );
};

export default Loader;