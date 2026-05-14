import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = ({ onSelectTheme }) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('preloader_shown');
    }
    return true;
  });
  const [isComplete, setIsComplete] = useState(true);

  useEffect(() => {
    // Animation skipped, preloader goes straight to final state
  }, []);

  // Columns data for 8 columns: E C O F L O W + Icons
  const columns = [
    { target: "E", bg: "#5c2415", text: "#c03c19", dir: Math.random() > 0.5 ? 1 : -1, delay: 0.2, duration: 6 + Math.random() * 2 },
    { target: "C", bg: "#ffd700", text: "#111111", dir: -1, delay: 0.5, duration: 5.5 + Math.random() * 2 },
    { target: "O", bg: "#8b8cff", text: "#111111", dir: 1, delay: 0.1, duration: 6.2 + Math.random() * 2 },
    { target: "F", bg: "#8c00ff", text: "#111111", dir: -1, delay: 0.8, duration: 5.8 + Math.random() * 2 },
    { target: "L", bg: "#b4e4ce", text: "#111111", dir: 1, delay: 0.3, duration: 6.5 + Math.random() * 2 },
    { target: "O", bg: "#ff6b6b", text: "#111111", dir: -1, delay: 0.6, duration: 6.0 + Math.random() * 2 },
    { target: "W", bg: "#4ecdc4", text: "#111111", dir: 1, delay: 0.4, duration: 6.8 + Math.random() * 2 },
    { target: "recycling", bg: "#16a34a", text: "#ffffff", dir: Math.random() > 0.5 ? 1 : -1, delay: 0.7, duration: 6.1 + Math.random() * 2 },
  ];

  // Specific words to scroll vertically per column
  const columnWords = [
    ["E", "C", "O", "F", "L", "O", "W"],
    ["L", "I", "V", "I", "N", "G"],
    ["S", "Y", "S", "T", "E", "M"],
    ["D", "E", "S", "I", "G", "N"],
    ["F", "L", "O", "W", "S"],
    ["F", "U", "T", "U", "R", "E"],
    ["R", "E", "N", "E", "W"],
    ["recycling", "delete", "delete_forever", "compost"]
  ];

  const TOTAL_ITEMS = 60; // Total letters per column
  const LETTER_HEIGHT_VH = 28; // Increased spacing between letters to avoid any overlap

  const HEBREW_SYMBOLS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'];

  const handleColumnClick = (col) => {
    if (!isComplete) return;
    
    // Pass the selected colors up
    if (onSelectTheme) {
      onSelectTheme({ bg: col.bg, text: col.text });
    }
    
    // Exit preloader and mark as shown in this session
    sessionStorage.setItem('preloader_shown', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[200] flex bg-[#1a1a1a] overflow-hidden"
        >
          {/* Columns Container */}
          <div className="flex-1 flex h-full w-full">
            {columns.map((col, colIndex) => {
              const baseWord = columnWords[colIndex];
              const isIconColumn = colIndex === 7;
              
              // Determine start and stop indices so there are always letters above and below
              const startIdx = col.dir === 1 ? 0 : TOTAL_ITEMS - 1;
              const stopIdx = col.dir === 1 ? TOTAL_ITEMS - 10 : 10;
              
              const letters = Array.from({ length: TOTAL_ITEMS }).map((_, i) => {
                // Force the target letter/icon at exactly the stop index
                if (i === stopIdx) return col.target;
                
                // If it's the icon column, use icon words. Otherwise, use Hebrew symbols from the start.
                if (isIconColumn) return baseWord[i % baseWord.length];
                return HEBREW_SYMBOLS[i % HEBREW_SYMBOLS.length];
              });

              // Calculate Y positions in vh
              // To center index `idx`, we move motion.div UP by `idx * LETTER_HEIGHT_VH + (LETTER_HEIGHT_VH / 2)`
              const getCenterY = (idx) => -(idx * LETTER_HEIGHT_VH + (LETTER_HEIGHT_VH / 2));
              
              const startY = getCenterY(startIdx);
              const endY = getCenterY(stopIdx);

              return (
                <div 
                  key={colIndex} 
                  className={`flex-1 h-full overflow-hidden relative flex justify-center transition-all duration-300 ${isComplete ? 'cursor-pointer hover:brightness-110 hover:scale-[1.02] z-10 shadow-2xl' : ''}`} 
                  style={{ backgroundColor: col.bg }}
                  onClick={() => handleColumnClick(col)}
                >
                  <motion.div
                    className="absolute w-full flex flex-col items-center"
                    style={{ top: '50%' }}
                    initial={{ y: `${endY}vh` }}
                    animate={{ y: `${endY}vh` }}
                    transition={{
                      duration: col.duration,
                      delay: col.delay,
                      ease: [0.22, 1, 0.36, 1], // Custom easeOut cubic: starts fast, slows down gradually
                    }}
                  >
                    {letters.map((letter, idx) => (
                      <div key={idx} className="w-full flex items-center justify-center" style={{ height: `${LETTER_HEIGHT_VH}vh` }}>
                        <motion.span 
                          className={`${isIconColumn ? 'material-symbols-outlined' : (idx !== stopIdx ? 'font-sans' : 'font-serif italic')} block text-center`} 
                          style={{ 
                            color: col.text, 
                            fontSize: isIconColumn ? '8vw' : (idx !== stopIdx ? '8vw' : '12vw'), 
                            lineHeight: '1', 
                            letterSpacing: '-0.01em', 
                            textTransform: 'uppercase'
                          }}
                          animate={{ 
                            opacity: isComplete ? (idx === stopIdx ? 1 : 0.05) : 1,
                            scale: isComplete && idx !== stopIdx ? 0.8 : 1
                          }}
                          transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                          {letter}
                        </motion.span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              );
            })}
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
