// src/pages/TermsAndConditions.jsx
import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Terms & Conditions</h2>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <p className="text-gray-700">This is the Terms & Conditions page. Please read these carefully before using our service.</p>
        <p className="text-gray-600">
          By accessing or using Project Disrupt, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms then you may not access the Service.
        </p>
        <h3 className="text-xl font-semibold mt-4">Accounts</h3>
        <p className="text-gray-600">
          When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>
        <h3 className="text-xl font-semibold mt-4">Content</h3>
        <p className="text-gray-600">
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
        </p>
      </div>
    </div>
  );
}