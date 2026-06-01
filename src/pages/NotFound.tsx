import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full"
      >
        <div className="mb-8 relative inline-block">
          <div className="text-[120px] font-black leading-none text-gray-100 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="p-4 bg-black rounded-2xl shadow-2xl rotate-3">
                <Search className="w-12 h-12 text-white" />
             </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
          Page Not Found
        </h1>
        
        <p className="text-gray-500 mb-10 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8 py-3 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-lg shadow-black/10 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </motion.div>

      {/* Decorative background elements */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-gray-50 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="fixed bottom-1/4 -right-20 w-64 h-64 bg-gray-50 rounded-full blur-3xl opacity-50 -z-10" />
    </div>
  );
};

export default NotFound;
