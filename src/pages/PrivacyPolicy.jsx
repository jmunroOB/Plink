// src/pages/PrivacyPolicy.jsx
import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Privacy Policy</h2>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <p className="text-gray-700">This is the Privacy Policy page. It outlines how we collect, use, and protect your data.</p>
        <p className="text-gray-600">
          Your privacy is important to us. This policy explains our practices regarding the collection, use, and disclosure of information that you may provide via this site.
        </p>
        <h3 className="text-xl font-semibold mt-4">Information Collection</h3>
        <p className="text-gray-600">
          We collect personal information that you voluntarily provide to us when you register on the site, express an interest in obtaining information about us or our products and services, when you participate in activities on the site or otherwise contact us.
        </p>
        <h3 className="text-xl font-semibold mt-4">Use of Your Information</h3>
        <p className="text-gray-600">
          We use personal information collected via our site for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
        </p>
      </div>
    </div>
  );
}