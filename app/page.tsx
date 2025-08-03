"use client";
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield } from 'lucide-react';
import IPGatekeeper from '@/components/IPGatekeeper';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

const floatingVariants = {
  animate: {
    y: [-20, 20, -20],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-3xl backdrop-blur-sm"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-tl from-purple-400/20 to-blue-500/20 rounded-full backdrop-blur-sm"
          style={{ animationDelay: '2s' }}
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-2xl backdrop-blur-sm"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 min-h-screen flex items-center justify-center p-4"
      >
        <div className="w-full max-w-5xl mx-auto">
          {/* Header - hanya judul */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl mb-6 shadow-2xl cursor-pointer"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              variants={itemVariants}
              className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent"
            >
              IP Gatekeeper
            </motion.h1>
            
            {/* Connect button */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="flex justify-center mb-8"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-blue-100">
                <ConnectButton />
              </div>
            </motion.div>
          </motion.div>

          {/* Main app container */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
          >
            {/* Header bar */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6"
            >
              <div className="flex items-center justify-between">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                  >
                    <Shield className="w-5 h-5 text-white" />
                  </motion.div>
                  <h2 className="text-white font-semibold text-xl">Protect Your Creative Work</h2>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center space-x-2 text-white/80 text-sm"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                  <span>Story Protocol</span>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Content area */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 80 }}
              className="p-8"
            >
              <IPGatekeeper />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
