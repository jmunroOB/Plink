// src/pages/CancellationPolicy.jsx
import React from 'react';

export default function CancellationPolicy() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Cancellation Policy</h2>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <p className="text-gray-700">
          This is our Cancellation Policy. Please read it carefully regarding your subscription.
        </p>
        <p className="text-gray-600">
          You can cancel your monthly subscription to Project Disrupt at any time.
          Upon cancellation, your access to premium features and your location listing will
          remain active until the end of your current billing cycle. No further charges will be applied.
        </p>
        <h3 className="text-xl font-semibold mt-4">How to Cancel:</h3>
        <p className="text-gray-600">
          To cancel your subscription, please visit your Profile page and look for the
          "Manage Subscription" or "Cancel Subscription" option. Follow the on-screen instructions.
          Alternatively, you can contact our support team at info@projectdisrupt.com for assistance.
        </p>
        <h3 className="text-xl font-semibold mt-4">Refunds:</h3>
        <p className="text-gray-600">
          Please note that we do not offer refunds for partial monthly subscription periods.
          Cancellations will take effect at the end of your current paid month.
        </p>
        <p className="text-gray-600">
          For any questions regarding your subscription or cancellation, please don't hesitate to contact us.
        </p>
      </div>
    </div>
  );
}
