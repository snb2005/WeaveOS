import React from 'react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  title = "Loading Workspace",
  subtitle = "Please wait while we prepare your environment...",
  progress = 70 
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
      {/* Geometric pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
      {/* Loading content */}
      <div className="text-center space-y-8">
        {/* Professional logo/branding */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">WEAVE OS</h1>
            <p className="text-gray-400 text-sm font-medium tracking-wider uppercase mt-2">
              Enterprise Operating System
            </p>
          </div>
        </div>
        
        {/* Professional loading spinner */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-700 rounded-full animate-spin border-t-blue-500"></div>
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-pulse border-t-blue-400"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-white text-lg font-medium">{title}</p>
            <p className="text-gray-400 text-sm">{subtitle}</p>
          </div>
        </div>
        
        {/* Loading progress indicator */}
        <div className="w-64 bg-gray-800 rounded-full h-1 mx-auto">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full animate-pulse transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="absolute bottom-8 text-center w-full">
        <p className="text-gray-500 text-sm">
          Powered by advanced web technologies
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
