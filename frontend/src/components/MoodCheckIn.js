import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal de Check-in de Humor Matinal
 * Interface adaptativa com animações suaves
 */
export function MoodCheckIn({ isOpen, onClose, onMoodSelect }) {
  const [selectedMood, setSelectedMood] = useState(null);

  const moods = [
    {
      id: 'energizado',
      emoji: '⚡',
      label: 'Energizado',
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Pronto para conquistar o dia!'
    },
    {
      id: 'motivado',
      emoji: '🔥',
      label: 'Motivado',
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Com disposição para progredir'
    },
    {
      id: 'neutro',
      emoji: '😌',
      label: 'Neutro',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Equilibrado e focado'
    },
    {
      id: 'cansado',
      emoji: '😴',
      label: 'Cansado',
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Preciso de um ritmo mais suave'
    },
    {
      id: 'estressado',
      emoji: '😰',
      label: 'Estressado',
      color: 'from-rose-400 to-rose-600',
      bgColor: 'bg-rose-50',
      description: 'Preciso focar no essencial'
    }
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    
    // Animar seleção e depois fechar
    setTimeout(() => {
      onMoodSelect(mood.id);
      onClose();
      setSelectedMood(null);
    }, 600);
  };

  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    selected: {
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 20
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl mx-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <span className="text-4xl">🌅</span>
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2">
                  Bom dia! ☀️
                </h2>
                <p className="text-white/90 text-lg">
                  Como você está se sentindo hoje?
                </p>
              </div>

              {/* Mood Options */}
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {moods.map((mood) => (
                    <motion.button
                      key={mood.id}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMoodSelect(mood)}
                      disabled={selectedMood !== null}
                      className={`relative p-6 rounded-2xl border-2 transition-all ${
                        selectedMood?.id === mood.id
                          ? 'border-indigo-500 shadow-lg shadow-indigo-200'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      } ${mood.bgColor} ${
                        selectedMood?.id === mood.id ? 'ring-4 ring-indigo-200' : ''
                      }`}
                    >
                      <div className="text-center">
                        <motion.div
                          animate={selectedMood?.id === mood.id ? 
                            { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : 
                            {}
                          }
                          transition={{ duration: 0.6 }}
                          className="text-4xl mb-2"
                        >
                          {mood.emoji}
                        </motion.div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">
                          {mood.label}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {mood.description}
                        </p>
                      </div>
                      
                      {selectedMood?.id === mood.id && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20 pointer-events-none"
                          style={{ backgroundImage: `linear-gradient(to right, ${mood.color})` }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.2 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Skip Option */}
                <div className="text-center">
                  <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                  >
                    Pular por agora →
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {selectedMood && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
