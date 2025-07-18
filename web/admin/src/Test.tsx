import React from 'react';

const Test: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <h1 className="text-3xl font-bold text-center">Test Page</h1>
        <p className="text-center text-gray-600">
          If you can see this, React is working!
        </p>
      </div>
    </div>
  );
};

export default Test;