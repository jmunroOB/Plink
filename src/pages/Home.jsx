// src/pages/Home.jsx

import React from 'react';
import { PlusSquare, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Plink</h1>
        <p className="text-gray-600 mb-6">
          Your modern platform to effortlessly list and discover unique locations for film, TV, and creative shoots across the UK.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/register" className="px-6 py-3 bg-black text-white rounded-md flex items-center gap-2 hover:bg-gray-800 transition-colors">
            <PlusSquare className="h-5 w-5" /> List Your Location
          </Link>
          <Link to="/search" className="px-6 py-3 border border-gray-300 text-gray-800 rounded-md flex items-center gap-2 hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5" /> Find a Location
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;