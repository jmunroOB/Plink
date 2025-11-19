// src/pages/FAQ.jsx
import React from 'react';

export default function FAQ() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Frequently Asked Questions</h2>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <p className="text-gray-700">This is the FAQ page. Content will be added here.</p>
        {/* You can add actual FAQ content here */}
        <div className="border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">Q: How do I list my property?</h3>
          <p className="text-gray-600">A: You can list your property by navigating to the "List Location" page and filling out the form. Our AI assistant can help you with descriptions!</p>
        </div>
        <div className="border-t pt-4">
          <h3 className="text-xl font-semibold mb-2">Q: How do I find a location?</h3>
          <p className="text-gray-600">A: Use the "Find Location" page. You can use manual filters or our AI assistant to describe what you're looking for.</p>
        </div>
      </div>
    </div>
  );
}