// src/pages/TermsOfService.jsx
import React from 'react';

export default function TermsOfService() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Terms of Service</h2>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <p className="text-gray-700">This is the Terms of Service page. This document outlines the rules and guidelines for using our platform.</p>
        <p className="text-gray-600">
          These Terms of Service ("Terms") govern your access to and use of the Project Disrupt website, products, and services ("Service"). Please read these Terms carefully before using our Service.
        </p>
        <h3 className="text-xl font-semibold mt-4">Your Agreement</h3>
        <p className="text-gray-600">
          By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
        </p>
        <h3 className="text-xl font-semibold mt-4">Changes to Terms</h3>
        <p className="text-gray-600">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
      </div>
    </div>
  );
}