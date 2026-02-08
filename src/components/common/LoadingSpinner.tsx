import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-white flex justify-center items-center z-[9999]">
       <div className="w-12 h-12 border-4 border-gray-200 border-t-[#235b4e] rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner;
