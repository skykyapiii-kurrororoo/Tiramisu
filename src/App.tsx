import { useState, useEffect, MouseEvent, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

const tiramisuImage = new URL('/tiramisuuu.png', import.meta.url).href;
const cakeImage = new URL('/cake.png', import.meta.url).href;
const greetingsImage = new URL('/Greetings.png', import.meta.url).href;
const tongueCatGif = new URL('/cat-cat-with-tongue.gif', import.meta.url).href;
const tiramisuMusic = new URL('/audio/Tiramisuu_Cake.mp3', import.meta.url).href;
const catMeowMusic = new URL('/audio/cat-meow-happy-birthday.mp3', import.meta.url).href;

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface FallingItem {
  id: number;
  x: number; // percentage from left (0 to 100)
  y?: number; // optional start percentage from top (0 to 100)
  size: number; // width in pixels
  duration: number; // travel time in seconds
  spinSpeed: number; // rotation amount
  drift: number; // horizontal drift amount
}

export default function App() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Responsive mobile state tracking
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize and handle background audio using the HTML5 Audio tag for .mp3 files
  useEffect(() => {
    // Playback starting function triggered by user session interaction
    const startPlayback = () => {
      const audio = audioRef.current;
      if (audio) {
        if (!audio.src) {
          const initialSrc = (currentPage === 3 || currentPage === 4) ? catMeowMusic : tiramisuMusic;
          audio.src = initialSrc;
          audio.load();
        }
        audio.play()
          .then(() => {
            setIsPlaying(true);
            removeFirstInteractionListeners();
          })
          .catch((err) => {
            console.log("Interaction playback deferred by browser autoplay policy:", err);
          });
      }
    };

    const removeFirstInteractionListeners = () => {
      document.removeEventListener("click", startPlayback);
      document.removeEventListener("touchstart", startPlayback);
      document.removeEventListener("keydown", startPlayback);
      document.removeEventListener("mousedown", startPlayback);
      document.removeEventListener("pointerdown", startPlayback);
    };

    // Listen to all interaction events in the document window to solve browser autoplay blocks
    document.addEventListener("click", startPlayback);
    document.addEventListener("touchstart", startPlayback);
    document.addEventListener("keydown", startPlayback);
    document.addEventListener("mousedown", startPlayback);
    document.addEventListener("pointerdown", startPlayback);

    // Attempt to start immediately (if browser policy permits)
    startPlayback();

    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      removeFirstInteractionListeners();
    };
  }, []);

  // Monitor the active page to switch background soundtracks dynamically
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Pick target music based on the current page context
    const targetSrc = (currentPage === 3 || currentPage === 4) ? catMeowMusic : tiramisuMusic;

    // Check if the current audio source is already configured with target track
    const currentSrcEnding = audio.src ? audio.src.substring(audio.src.lastIndexOf("/")) : "";
    const targetSrcEnding = targetSrc.substring(targetSrc.lastIndexOf("/"));

    if (currentSrcEnding !== targetSrcEnding) {
      audio.src = targetSrc;
      audio.load();
      if (isPlaying) {
        audio.play().catch((err) => {
          console.log("Dynamic track switch playback deferred:", err);
        });
      }
    }
  }, [currentPage, isPlaying]);

  // Periodically generate background falling tiramisus
  useEffect(() => {
    // Generate a few initial falling items pre-staggered so the screen starts populated
    const initialItems: FallingItem[] = Array.from({ length: 8 }).map((_, idx) => ({
      id: Math.random() + idx,
      x: Math.random() * 90 + 5,
      y: Math.random() * 70 - 15, // staggered top vertical start positions
      size: Math.random() * (isMobile ? 20 : 45) + (isMobile ? 35 : 55), // Smaller on mobile for better clutter control
      duration: Math.random() * 6 + 8, // slightly gentler float durations
      spinSpeed: (Math.random() - 0.5) * 240,
      drift: (Math.random() - 0.5) * 15, // subtle horizontal drift
    }));
    setFallingItems(initialItems);

    // Continuous spawn loop
    const interval = setInterval(() => {
      setFallingItems((prev) => {
        // Prevent infinite state growth by pruning items that completed travel or keeping size capped
        const pruned = prev.filter((item) => prev.length < 24 || Math.random() > 0.1);
        
        const newItem: FallingItem = {
          id: Math.random() + Date.now(),
          x: Math.random() * 95 + 2.5,
          y: -15, // start above view
          size: Math.random() * (isMobile ? 20 : 45) + (isMobile ? 35 : 55), // Smaller on mobile
          duration: Math.random() * 6 + 8,
          spinSpeed: (Math.random() - 0.5) * 240,
          drift: (Math.random() - 0.5) * 15,
        };
        
        return [...pruned.slice(-20), newItem];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isMobile]);

  // Handle click on canvas to spawn subtle interactive ripples and custom tumble tiramisus
  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Create ripple event
    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
    };
    setRipples((prev) => [...prev, newRipple]);

    // 2. Spawn a falling tiramisu from clicked coordinate
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    const clickedTumble: FallingItem = {
      id: Date.now() + Math.random(),
      x: percentX,
      y: percentY,
      size: Math.random() * (isMobile ? 25 : 40) + (isMobile ? 45 : 70), // Scaled down on mobile to avoid overcrowding
      duration: Math.random() * 3 + 4, // falls slightly faster
      spinSpeed: (Math.random() - 0.5) * 600, // spin rapidly
      drift: (Math.random() - 0.5) * 22, // drift wider
    };

    setFallingItems((prev) => [...prev, clickedTumble]);

    // 3. Auto-play music upon the first click interaction if not already playing
    if (audioRef.current && !isPlaying) {
      try {
        audioRef.current.muted = false;
        audioRef.current.preload = 'auto';
        // Only set the source if it's not already the tiramisu track
        if (!audioRef.current.src || !audioRef.current.src.includes('/Tiramisuu_Cake.mp3')) {
          audioRef.current.src = tiramisuMusic;
          audioRef.current.load();
        }
        const p = audioRef.current.play();
        if (p && typeof p.then === 'function') {
          p.then(() => setIsPlaying(true)).catch((err) => console.log('Audio play promise rejected:', err));
        }
      } catch (err) {
        console.log('Audio play error:', err);
      }
    }
  };

  // Automatically clean up stale ripples
  useEffect(() => {
    if (ripples.length === 0) return;
    const timer = setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [ripples]);

  const handleRootClick = (e: MouseEvent<HTMLDivElement>) => {
    // 1. Spawns custom ripple and interactive floating items
    handleCanvasClick(e);

    // 2. Advance pages
    if (currentPage === 2) {
      setCurrentPage(3);
    } else if (currentPage === 3) {
      setCurrentPage(4);
    } else if (currentPage === 4) {
      setCurrentPage(1);
    }
  };

  return (
    <div
      id="blank-canvas-root"
      onClick={handleRootClick}
      className="h-screen h-[100dvh] w-screen w-[100dvw] bg-[#fcfcfb] font-sans relative overflow-hidden flex flex-col items-center justify-center p-6 select-none transition-colors duration-1000 cursor-pointer"
      style={{
        backgroundImage: `radial-gradient(#e3e4e0 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      {/* Background Ripple Layer */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ opacity: 0.6, scale: 0 }}
              animate={{ opacity: 0, scale: 3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: ripple.x - 24,
                top: ripple.y - 24,
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1px solid rgba(28, 30, 25, 0.12)",
                backgroundColor: "rgba(28, 30, 25, 0.01)",
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Persistent Falling Tiramisu Images Layer (Continues to float seamlessly) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden w-full h-full">
        <AnimatePresence>
          {fallingItems.map((item) => (
            <motion.img
              key={item.id}
              src={tiramisuImage}
              alt="Falling Tiramisu"
              referrerPolicy="no-referrer"
              initial={{
                y: 0,
                x: 0,
                rotate: 0,
                opacity: 0,
                scale: 0.4,
              }}
              animate={{
                y: "125vh",
                x: `${item.drift}vw`,
                rotate: item.spinSpeed,
                opacity: [0, 0.95, 0.95, 0],
                scale: 1,
              }}
              transition={{
                duration: item.duration,
                ease: "linear",
                times: [0, 0.1, 0.85, 1],
              }}
              style={{
                position: "absolute",
                top: item.y !== undefined ? `${item.y}%` : "-120px",
                left: `${item.x}%`,
                width: item.size,
                height: "auto",
                transformOrigin: "center center",
                filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.08))",
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Content Switcher with Elegant Transition Frame */}
      <AnimatePresence mode="wait">
        {currentPage === 1 && (
          <motion.main
            key="cake-dashboard"
            initial={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ 
              opacity: 0, 
              scale: 0.82, 
              filter: "blur(15px)",
              transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } 
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="z-30 relative flex items-center justify-center max-w-full"
          >
            <div className="relative max-w-[310px] w-full flex items-center justify-center">
              <div className="relative w-full">
                {/* Arched "Click Me!" Message layered directly on top of the image */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-20 sm:-top-14 left-0 w-full h-32 pointer-events-none select-none z-40"
                >
                  <svg viewBox="0 0 400 150" className="w-full h-full">
                    <defs>
                      <style>
                        {`
                          @font-face {
                            font-family: 'SugarFree';
                            src: local('Sugar Free DEMO Normal'),
                                 local('SugarFreeDEMO-Normal'),
                                 url('/sugarfreeDEMO.otf') format('opentype');
                          }
                        `}
                      </style>
                    </defs>
                    <path id="text-curve" d="M 50,120 Q 200,35 350,120" fill="transparent" />
                    <text
                      className="text-[34px] sm:text-[56px] md:text-[72px] lg:text-[78px] fill-[#4a3328] tracking-wider font-sugar font-bold"
                      style={{
                        fontFamily: "'SugarFree', 'Sugar Free DEMO Normal', sans-serif",
                        dominantBaseline: 'middle'
                      }}
                    >
                      <textPath href="#text-curve" startOffset="50%" textAnchor="middle">
                        CLICK ME!
                      </textPath>
                    </text>
                  </svg>
                </motion.div>

                <img
                  src={tiramisuImage}
                  alt="Tiramisu Cake"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[75vh] object-contain drop-shadow-[0_16px_50px_rgba(0,0,0,0.09)] transform hover:scale-[1.045] active:scale-[0.98] transition-all duration-500 ease-out cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();

                    // Generate a dramatic sweet cascade of giant tumbling tiramisus matching user trigger click
                    const burstItems: FallingItem[] = Array.from({ length: isMobile ? 10 : 18 }).map((_, idx) => ({
                      id: Date.now() + Math.random() + idx,
                      x: Math.random() * 110 - 5,
                      y: Math.random() * -30 - 5,
                      size: Math.random() * (isMobile ? 35 : 65) + (isMobile ? 50 : 85), // Scaled down on mobile to fit nicely
                      duration: Math.random() * 3.5 + 4.5, // fast & graceful cascade
                      spinSpeed: (Math.random() - 0.5) * 500,
                      drift: (Math.random() - 0.5) * 30,
                    }));
                    setFallingItems((prev) => [...prev, ...burstItems]);

                    // Move to page 2 first, then start playback without resetting position
                    setCurrentPage(2);

                    if (audioRef.current && !isPlaying) {
                      try {
                        audioRef.current.muted = false;
                        audioRef.current.preload = 'auto';
                        // Only set the source if it isn't already the tiramisu track
                        if (!audioRef.current.src || !audioRef.current.src.includes('/Tiramisuu_Cake.mp3')) {
                          audioRef.current.src = tiramisuMusic;
                          audioRef.current.load();
                        }
                        const prom = audioRef.current.play();
                        if (prom && typeof prom.then === 'function') {
                          prom.then(() => setIsPlaying(true)).catch((err) => console.log('Audio play promise rejected:', err));
                        }
                      } catch (err) {
                        console.log('Audio play error:', err);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </motion.main>
        )}

        {currentPage === 2 && (
          <motion.div
            key="blank-canvas-details"
            initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              filter: "blur(6px)",
              transition: { duration: 0.6, ease: "easeIn" } 
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="z-30 w-full max-w-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          >
            <div className="flex items-center justify-center mb-8 w-full">
              {/* Cake Image */}
              <motion.img
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.03 }}
                src={cakeImage}
                alt="Delicious Cake"
                referrerPolicy="no-referrer"
                className="w-auto h-auto max-w-[85vw] sm:max-w-full max-h-[52vh] sm:max-h-[70vh] md:max-h-[75vh] object-contain rounded-3xl mix-blend-multiply cursor-pointer"
              />
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.35, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xs uppercase tracking-widest text-[#4a3328] font-mono select-none pointer-events-none"
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        )}

        {currentPage === 3 && (
          <motion.div
            key="page-3-blank"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ 
              opacity: 0, 
              scale: 0.96, 
              filter: "blur(8px)",
              transition: { duration: 0.6, ease: "easeIn" } 
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="z-30 w-full max-w-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          >
            <div className="flex items-center justify-center mb-8 w-full">
              {/* Greetings Image */}
              <motion.img
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.03 }}
                src={greetingsImage}
                alt="Greetings"
                referrerPolicy="no-referrer"
                className="w-auto h-auto max-w-[85vw] sm:max-w-full max-h-[52vh] sm:max-h-[70vh] md:max-h-[75vh] object-contain rounded-3xl mix-blend-multiply cursor-pointer"
              />
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.35, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xs uppercase tracking-widest text-[#4a3328] font-mono select-none pointer-events-none"
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        )}

        {currentPage === 4 && (
          <motion.div
            key="page-4-gif"
            initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              filter: "blur(6px)",
              transition: { duration: 0.6, ease: "easeIn" } 
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="z-30 w-full max-w-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          >
            {/* Top Heading using Custom Font */}
            <motion.h1
              initial={{ scale: 0.9, opacity: 0, y: -15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6, type: "spring" }}
              className="text-4xl sm:text-5xl md:text-6xl text-[#4a3328] font-sugar tracking-wider mb-2 select-none pointer-events-none"
              style={{ fontFamily: "'SugarFree', 'Sugar Free DEMO Normal', sans-serif" }}
            >
              Seee yaaa!
            </motion.h1>

            <div className="flex items-center justify-center mb-3 w-full">
              {/* Cat Tongue GIF */}
              <motion.img
                initial={{ scale: 0.9, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.03 }}
                src={tongueCatGif}
                alt="Cute Cat with Tongue"
                referrerPolicy="no-referrer"
                className="w-auto h-auto max-w-[85vw] sm:max-w-full max-h-[52vh] sm:max-h-[70vh] md:max-h-[75vh] object-contain rounded-3xl mix-blend-multiply cursor-pointer"
              />
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 0.9, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6, type: "spring" }}
              className="mt-2 select-none pointer-events-none"
            >
              <h2
                className="text-2xl sm:text-3xl md:text-4xl text-[#4a3328] font-sugar tracking-wide"
                style={{ fontFamily: "'SugarFree', 'Sugar Free DEMO Normal', sans-serif" }}
              >
                {"Happyyy Senpai's Dayy! :>"}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={tiramisuMusic}
        loop
        className="hidden pointer-events-none w-0 h-0 opacity-0"
        aria-hidden="true"
      />
    </div>
  );
}