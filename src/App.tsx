/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Grid, 
  Sun, 
  Eye,
  Headphones, 
  ArrowRight, 
  X, 
  MoreHorizontal,
  ChevronRight,
  Home,
  Activity,
  Zap,
  Download,
  Search,
  Wrench,
  Bot,
  Sparkles,
  Youtube,
  Instagram,
  Music,
  Globe,
  FileText,
  Languages,
  QrCode,
  Layers,
  CheckCircle2,
  Play,
  Pause,
  Github,
  MessageCircle,
  Settings,
  Terminal as TerminalIcon,
  Copy,
  Hash
} from "lucide-react";
import { useState, useEffect } from "react";

// --- Types ---

type PageId = "home" | "apis";

interface Theme {
  canvas: string;
  primary: string;
  grid: string;
  gridSize: number;
}

// --- Components ---
const domainApi = "https://starlights-api.vercel.app"
const Navbar = ({ activePage, onNavigate }: { activePage: PageId, onNavigate: (page: PageId) => void }) => {
  const menuItems = [
    { id: "home" as const, text: "Home", icon: Home },
    { id: "apis" as const, text: "APIs", icon: Activity },
  ];

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-[calc(100%-64px)] md:max-w-[540px]">
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/80 backdrop-blur-xl rounded-editorial-pill h-[72px] flex items-center justify-between px-4 shadow-editorial border border-black/5"
      >
        <div className="flex items-center gap-2 w-full">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 py-3 rounded-editorial-pill text-sm font-black flex items-center justify-center gap-2.5 transition-all duration-300 ${
                activePage === item.id 
                  ? "bg-black text-white shadow-lg" 
                  : "text-[#555555] hover:bg-black/5"
              }`}
            >
              <item.icon size={18} strokeWidth={activePage === item.id ? 3 : 2} />
              <span className="hidden sm:inline">{item.text}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pl-4 pr-2 shrink-0 border-l border-black/5 ml-2">
          <a href="https://www.instagram.com/srt.conti?igsh=eW15d202OGQwOTU0" target="_blank" rel="noreferrer" className="relative group block cursor-pointer">
            <div className="w-[42px] h-[42px] rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
              <img 
                src="https://i.postimg.cc/WpQKXwFP/6247a858-1292-4f33-b71c-1cbcac1c4574.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
               <Heart size={12} fill="red" className="text-red-500" />
            </div>
          </a>
        </div>
      </motion.div>
    </nav>
  );
};

const SONGS = [
  { title: "Rels B - A MÍ", url: "https://raw.githubusercontent.com/IrokzDal/uploads/main/1779061580344.mp3" },
  { title: "Rels B - Love It", url: "https://raw.githubusercontent.com/IrokzDal/uploads/main/1779066764574.mp3" },
  { title: "Rex Country - Pluto Projector", url: "https://raw.githubusercontent.com/IrokzDal/uploads/main/1779066880535.mp3" }
];

const selectedSong = typeof window !== 'undefined' ? SONGS[Math.floor(Math.random() * SONGS.length)] : SONGS[0];

let globalAudio: HTMLAudioElement | null = typeof window !== 'undefined' ? new Audio(selectedSong.url) : null;
if (globalAudio) {
  globalAudio.crossOrigin = "anonymous";
  globalAudio.preload = "metadata";
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const MusicWidget = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (!globalAudio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(globalAudio?.currentTime || 0);
    const handleLoadedMetadata = () => {
      if (globalAudio?.duration) {
        setDuration(globalAudio.duration);
      }
    };
    
    globalAudio.addEventListener('ended', handleEnded);
    globalAudio.addEventListener('play', handlePlay);
    globalAudio.addEventListener('pause', handlePause);
    globalAudio.addEventListener('timeupdate', handleTimeUpdate);
    globalAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Sync state initially
    setIsPlaying(!globalAudio.paused);
    setCurrentTime(globalAudio.currentTime || 0);
    if (globalAudio.duration && !isNaN(globalAudio.duration)) {
      setDuration(globalAudio.duration);
    }
    
    return () => {
      if (globalAudio) {
        globalAudio.removeEventListener('ended', handleEnded);
        globalAudio.removeEventListener('play', handlePlay);
        globalAudio.removeEventListener('pause', handlePause);
        globalAudio.removeEventListener('timeupdate', handleTimeUpdate);
        globalAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, []);

  const togglePlay = () => {
    if (!globalAudio) return;

    if (globalAudio.paused) {
      globalAudio.play().catch(console.error);
    } else {
      globalAudio.pause();
    }
  };

  const timeRemaining = duration > 0 ? duration - currentTime : 0;
  const timeDisplay = `-${formatTime(timeRemaining)}`;

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="w-full bg-white h-[100px] rounded-[32px] px-[32px] flex items-center justify-between shadow-editorial relative overflow-hidden group cursor-pointer border border-black/5"
      onClick={togglePlay}
    >
      {isPlaying && (
        <div className="absolute inset-0 opacity-5 flex items-center justify-around px-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [10, 50, 10] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.05 }}
              className="w-1 bg-black rounded-full"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-5 z-10">
        <div className={`p-3 rounded-full transition-all duration-500 shadow-md ${isPlaying ? 'bg-black text-white scale-110' : 'bg-black/5 text-black'}`}>
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </div>
        <div>
          <p className="text-black font-black text-[18px] tracking-tight">{selectedSong.title}</p>
          <p className="text-black/40 text-[13px] font-bold uppercase tracking-widest mt-1">My Music</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 z-10">
        <span className="text-black/60 text-sm font-mono font-bold w-12 text-right">{timeDisplay}</span>
      </div>
    </motion.div>
  );
};

const TypingEffect = ({ text, delay = 0 }: { text: string, delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    setDisplayedText("");
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return <span>{displayedText}</span>;
};

const TerminalSnippet = ({ command, output, bgImage, file }: { command: string, output: string, bgImage?: string, file?: string }) => {
  return (
    <div className="relative bg-[#0a0a0a] rounded-lg overflow-hidden border border-white/10 shadow-lg font-mono text-[12px] leading-relaxed w-full group/terminal flex flex-col max-h-[340px]">
      {/* Immersive Background Image Layer */}
      {bgImage && (
        <div className="absolute inset-0 z-0 opacity-40 group-hover/terminal:opacity-50 transition-all duration-1000 pointer-events-none">
          <img src={bgImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}
      
      <div className="relative z-10 bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5 backdrop-blur-sm shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-red-500/50 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-500/50 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500/50 rounded-full"></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{file || "Session Node"}</span>
          <Copy size={12} className="text-white/20 hover:text-white transition-colors cursor-pointer" />
        </div>
      </div>

      <div className="relative z-10 p-5 space-y-4 flex-1 overflow-y-auto scrollbar-thin pb-8">
        <div className="flex gap-3 items-start">
          <span className="bg-green-500/20 text-green-400 font-black px-1.5 py-0.5 rounded border border-green-500/30 text-[10px] shrink-0">$</span>
          <div className="flex flex-col gap-3">
            <span className="text-white font-black tracking-tight text-[13px] drop-shadow-md break-all">{command}</span>
            <div className="text-white/60 font-bold whitespace-pre-wrap leading-relaxed text-[12px] drop-shadow-md">
              {output || "Process execution stream active...\r\n[10.02.24] Buffer initialized\r\n[10.02.25] Response metadata received\r\n[10.02.26] Parsing payload..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomeView = () => {
  const [isLiked, setIsLiked] = useState(false);
  const currentDate = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date());
  const currentDay = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

  const [weather, setWeather] = useState<{ temp: string, desc: string } | null>(null);

  useEffect(() => {    
    fetch('https://get.geojs.io/v1/ip/geo.json')
      .then(res => res.json())
      .then(data => {
        if (data.latitude && data.longitude) {
           return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current_weather=true&timeout=5`);
        }
        throw new Error('Location not found');
      })
      .then(res => res.json())
      .then(data => {
        if (data.current_weather) {
            setWeather({
              temp: `${Math.round(data.current_weather.temperature)}°C`,
              desc: "Temperature",
            });
        }
      }).catch(err => {
         setWeather({ temp: "15°C", desc: "Temperature" });
      });
  }, []);

  const [randomHomeImage] = useState(() => {
    const images = [
      "https://i.postimg.cc/KYf8fLkY/751602e4-470a-4160-b131-5c15bbc05fc9.jpg",
      "https://i.postimg.cc/25ySHy4t/7da5a91f-b619-46f2-88e1-e843021f2ca0.jpg",
      "https://i.postimg.cc/YCnpm7Jd/ac202948-23b0-4e7f-a2f2-ff3f58337fbc.jpg"
    ];
    return images[Math.floor(Math.random() * images.length)];
  });

  return (
    <div className="w-full max-w-[1600px] flex flex-col gap-[26px]">
      <div className="flex flex-col lg:flex-row gap-[26px] w-full">
      <div className="flex flex-col gap-[22px] w-full lg:max-w-[52%]">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative h-[180px] rounded-[32px] overflow-hidden group shadow-editorial"
        >
          <img 
            src={randomHomeImage} 
            alt="Random Background" 
            className="w-full h-full object-cover vintage-filter group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/2 to-black/28"></div>
          <div className="absolute top-6 left-6 text-white">
            <Heart size={20} fill="white" />
          </div>
          <div className="absolute bottom-6 right-8 text-white text-right">
            <p className="text-xl font-display font-black tracking-tight drop-shadow-lg capitalize">{currentDate}</p>
            <p className="text-sm font-bold opacity-80">ig : @srt.conti</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white rounded-[34px] p-[34px] shadow-editorial border border-black/5"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-sm font-black text-[#c0bebe] flex-wrap">
              <div className="flex items-center gap-2">
                <img src="https://i.postimg.cc/Z5Vt0hWc/3391d30c-2a2d-48ea-8ecd-3dc0617aeab9.jpg" alt="@srt.conti" className="w-5 h-5 rounded-full object-cover shadow-sm" />
                <span className="text-[#111111]">@srt.conti</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
              <div className="flex items-center gap-2">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="Node.js" className="w-[18px] h-[18px] object-contain drop-shadow-sm hover:scale-110 transition-transform" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="Python" className="w-[18px] h-[18px] object-contain drop-shadow-sm hover:scale-110 transition-transform" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="PHP" className="w-[18px] h-[18px] object-contain drop-shadow-sm hover:scale-110 transition-transform" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg" alt="HTML" className="w-[18px] h-[18px] object-contain drop-shadow-sm hover:scale-110 transition-transform" />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg" alt="Bash" className="w-[18px] h-[18px] object-contain drop-shadow-sm hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          <h1 className="font-display text-[34px] md:text-[52px] font-black leading-[1] text-editorial-primary mb-6 tracking-tighter">
            Welcome my Apis
          </h1>

          <p className="text-[15px] leading-[1.6] text-editorial-secondary font-sans max-w-[95%] font-bold">
            <TypingEffect text="Well, I'm Berling and I'm fascinated by music, video games,Telegram, Discord, WhatsApp bots, Instagram Bots, TikTok Bots, Web scraping, creating pages and more" delay={300} />
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-[18px]">
          <MusicWidget />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          {/* White Rectangular Terminal replacing photo card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="relative bg-white rounded-[28px] overflow-hidden h-[210px] shadow-editorial border border-black/5 p-6 group"
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.35, 0.45, 0.35] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 pointer-events-none"
            >
              <img 
                src="https://i.postimg.cc/zB4x3xwV/a04d9763-e469-4c75-8394-65c1d377ae51.jpg"
                className="w-full h-full object-cover"
                alt="bg"
              />
            </motion.div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 bg-black/20 rounded-full" />
                <div className="w-2.5 h-2.5 bg-black/20 rounded-full" />
              </div>
              <TerminalIcon size={16} className="text-black/40" />
            </div>
            <div className="font-mono text-[12px] text-black/80 space-y-2 relative z-10 font-medium px-2 py-2">
              <div className="flex gap-2"><span className="text-black font-bold">➜</span> <TypingEffect text="Berling Conti" delay={500} /></div>
              <div className="flex gap-2"><span className="text-black font-bold">➜</span> <TypingEffect text="Edad 18" delay={1200} /></div>
              <div className="flex gap-2"><span className="text-black font-bold">➜</span> <TypingEffect text="Blink" delay={1800} /></div>
              <div className="flex gap-2"><span className="text-black font-bold">➜</span> <TypingEffect text="Pais I'm from Peru" delay={2300} /></div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-[16px]">
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white h-[90px] rounded-[24px] px-6 flex items-center gap-5 shadow-editorial border border-black/5"
            >
              <div className="bg-orange-50 p-3 rounded-full text-orange-400 shadow-sm">
                <Sun size={26} />
              </div>
              <div className="flex flex-col">
                <p className="font-black text-[22px] leading-tight text-gray-900">{weather ? weather.temp : "..."}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{weather ? weather.desc : "Fetching..."}</p>
              </div>
            </motion.div>

            <motion.div className="h-[12px] bg-[#dcdcdc] rounded-full overflow-hidden border border-black/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "72%" }}
                transition={{ delay: 1, duration: 1 }}
                className="h-full bg-black rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative flex-1 rounded-[42px] overflow-hidden min-h-[600px] lg:min-h-[1080px] shadow-editorial-large border border-black/5 group"
      >
        <img 
          src="https://i.postimg.cc/ydCsqCWj/IMG-20260517-WA0149.jpg" 
          alt="Editorial Beach" 
          className="absolute inset-0 w-full h-full object-cover vintage-filter group-hover:scale-[1.04] transition-transform duration-[2s]"
          referrerPolicy="no-referrer"
        />

        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-8 left-8 w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg border border-white/20 ${
            isLiked ? 'bg-red-500 text-white border-red-400' : 'bg-white/20 text-white hover:bg-white/40'
          }`}
        >
          <Heart size={20} strokeWidth={3} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "animate-pulse" : ""} />
        </button>

        <div className="absolute bottom-[20%] left-10 z-20">
          <div className="text-white text-[16px] font-black leading-[1.3] space-y-1 drop-shadow-xl">
            <p>My favorite Kpop group.</p>
            <p className="font-black underline decoration-4 underline-offset-4">Aespa with 4 members</p>
            <p>My Bias is Karina</p>
          </div>
        </div>
      </motion.div>
      </div>

      <motion.div 
        whileHover={{ y: -4, scale: 1.02 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/10 backdrop-blur-xl px-12 py-4 rounded-full border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex items-center justify-center gap-10 z-[100] min-w-[280px]"
      >
        <a href="https://github.com" target="_blank" rel="noreferrer" className="text-black/70 hover:text-black hover:drop-shadow-md transition-all transform hover:scale-125"><Github size={24} /></a>
        <a href="https://www.youtube.com/@light_koshii" target="_blank" rel="noreferrer" className="text-black/70 hover:text-black hover:drop-shadow-md transition-all transform hover:scale-125"><Youtube size={24} /></a>
        <a href="https://wa.me/+51910108980" target="_blank" rel="noreferrer" className="text-black/70 hover:text-black hover:drop-shadow-md transition-all transform hover:scale-125"><MessageCircle size={24} /></a>
        <a href="https://www.instagram.com/srt.conti?igsh=eW15d202OGQwOTU0" target="_blank" rel="noreferrer" className="text-black/70 hover:text-black hover:drop-shadow-md transition-all transform hover:scale-125"><Instagram size={24} /></a>
      </motion.div>
    </div>
  );
};

const APIsView = () => {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);

  const sections = [
    {
      title: "Downloaders",
      icon: Download,
      desc: "data extraction, whether on youtube, deezer, spotify, instagram, facebook, etc.",
      bgImage: "https://i.postimg.cc/qvy2wmxY/(3).jpg",
      items: [
        {
    "name": "Ytmp3",
    "icon": Download,
    "desc": "Extract audio and info directly from YouTube",
    "method": "GET",
    "auth": "NONE",
    "terminal": {
        "file": "Youtube",
        "cmd": "curl -X GET \"" + domainApi + "/api/dl/ytdl?url=https://youtube.com/watch?v=Q4Js9OEODHM\""
    }
},
        {
    "name": "SoundCloud",
     "icon": Download,
     "desc": "Extract audio and info directly from SoundCloud",
     "method": "GET",
     "auth": "NONE",
     "terminal": {
    "file": "Soundcloud",
    "cmd": "curl -X GET \"" + domainApi + "/api/dl/soundcloud?url=https://on.soundcloud.com/TYEoCKy7mkYQ6aHcl4\""
      }
     },
     {
    "name": "Applemusic",
     "icon": Download,
     "desc": "Extract audio and info directly from Applemusic",
     "method": "GET",
     "auth": "NONE",
     "terminal": {
    "file": "Applemusic",
    "cmd": "curl -X GET \"" + domainApi + "/api/dl/applemusic?url=https://music.apple.com/es/song/call-out-my-name/1363310482\""
      }
     },   
        { 
          name: "TikTok Saver", 
          icon: Music, 
          desc: "Extract clean videos without watermarks automatically.",
          method: "GET",
          auth: "BEARER",
          terminal: { 
            file: "TIKTOK_EXTRACT.PY",
            cmd: "curl https://api.starlights.com/v1/tiktok?v=1029 \\\n  -H 'Authorization: Bearer <API_KEY>'" 
          }
        },
        { 
          name: "Instagram Archiver", 
          icon: Instagram, 
          desc: "Archive profiles, stories and posts to cloud storage.",
          method: "POST",
          auth: "SESSION",
          terminal: { 
            file: "IG_ARCHIVE.JS",
            cmd: "node archive.js --user='issie' --target='s3://bucket'" 
          }
        }
      ]
    },
    {
      title: "Searchs",
      icon: Search,
      desc: "extracting results by search either on google, spotify, youtube, deezer, facebook, etc. ",
      bgImage: "https://i.postimg.cc/qvy2wmxY/(3).jpg",
      items: [
        { 
          name: "Global Web Scout", 
          icon: Globe, 
          desc: "Advanced search engine orchestration for real-time trend mapping.",
          method: "GET",
          auth: "API_KEY",
          terminal: { 
            file: "WEB_SCOUT.SH",
            cmd: "curl https://api.starlights.com/v1/search?q='minimalism'" 
          }
        },
        { 
          name: "Semantic Wiki", 
          icon: FileText, 
          desc: "Extract structured intelligence from open knowledge databases.",
          method: "POST",
          auth: "NONE",
          terminal: { 
            file: "WIKI_FETCH.PY",
            cmd: "python wiki.py --query='Modernism' --format=json" 
          }
        }
      ]
    },
    {
      title: "AI",
      icon: Bot,
      desc: "making requests to artificial intelligences either in Gemini, Perplexity, Blackbox, Claude, Chatgpt, etc.",
      bgImage: "https://i.postimg.cc/qvy2wmxY/(3).jpg",
      items: [
        {
  "name": "Cover AI",
  "icon": Sparkles,
  "desc": "AI voice cover generator that transforms any audio using different voice models",
  "method": "POST",
  "auth": "Server",
  "terminal": {
    "file": "Cover Ai",
    "cmd": "curl -X POST " + domainApi + "/api/ai/cover-ai -H 'Content-Type: application/json' -d '{\"voice\":\"ai-hatsune-miku\",\"url\":\"https://raw.githubusercontent.com/IrokzDal/uploads/main/1779473749322.mp3\"}'"
  }
},
        { 
  "name": "GPT-4o", 
  "icon": Sparkles, 
  "desc": "Model used in this api is Openai version Gpt-4o",
  "method": "POST",
  "auth": "SERVER",
  "terminal": { 
    "file": "GPT-4o",
    "cmd": "curl -X POST \"" + domainApi + "/api/ai/gpt-4o\" -H \"Content-Type: application/json\" -d '{\"message\":\"Hello\"}'"
  }
},
        { 
          name: "Contextual NLP", 
          icon: MessageCircle, 
          desc: "Natural language processing with high-dimensional context awareness.",
          method: "POST",
          auth: "BEARER",
          terminal: { 
            file: "NLP_STREAM.PY",
            cmd: "python chat.py --msg='Build a legacy'" 
          }
        }
      ]
    },
    {
      title: "Tools",
      icon: Wrench,
      desc: "tools such as ToQR, generators, converters, and other utilities created to facilitate development.",
      bgImage: "https://i.postimg.cc/qvy2wmxY/(3).jpg",
      items: [
        { 
          name: "Polyglot Node", 
          icon: Languages, 
          desc: "Universal translation bridge supporting 120+ technical dialects.",
          method: "POST",
          auth: "BEARER",
          terminal: { 
            file: "TRANSLATE.SH",
            cmd: "curl -X POST api.v1/translate -d '{\"text\":\"Hello\"}'" 
          }
        },
        { 
          name: "QR Generator", 
          icon: QrCode, 
          desc: "High-density data encoding to vectorized matrix symbols.",
          method: "GET",
          auth: "NONE",
          terminal: { 
            file: "QR_GEN.PY",
            cmd: "python qr.py --url='https://issie.io' --size=512" 
          }
        }
      ]
    }
  ];

  const activeSection = sections[activeSectionIdx];
  const activeModule = activeSection.items[activeModuleIdx] || activeSection.items[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[900px]"
    >
      {/* Sidebar Navigation */}
      <div className="lg:col-span-3">
        <div className="sticky top-[160px] bg-white p-4 rounded-[32px] border border-black/5 shadow-editorial flex flex-col gap-2">
          {sections.map((section, idx) => (
            <button
              key={section.title}
              onClick={() => {
                setActiveSectionIdx(idx);
                setActiveModuleIdx(0);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[11px] ${
                activeSectionIdx === idx 
                  ? "bg-white text-black shadow-xl scale-[1.02] border border-black/5" 
                  : "text-black/30 hover:text-black hover:bg-black/10"
              }`}
            >
              <section.icon size={18} strokeWidth={3} />
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-9 flex flex-col gap-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            {/* Section Header */}
            <header className="flex flex-col gap-6 border-b border-black/5 pb-10">
              <div className="flex items-center gap-6">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                    <img 
                      src="https://i.postimg.cc/sXW64fqR/120fab07-9673-4cec-bb49-c403a6b122ca.jpg" 
                      alt="Section Icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -bottom-1 -right-1 bg-black text-white p-2 rounded-full border-2 border-white"
                  >
                    <activeSection.icon size={16} strokeWidth={3} />
                  </motion.div>
                </motion.div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-black/20">ig : @srt.conti</span>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">{activeSection.title}</h2>
                </div>
              </div>
              <div className="max-w-xl">
                <p className="text-base font-bold text-black/60 leading-relaxed border-l-4 border-black/5 pl-4">
                  <TypingEffect text={`The ${activeSection.title} section is based on ${activeSection.desc.toLowerCase()}`} />
                </p>
              </div>
            </header>

            {/* Modules In Section */}
            <div className="flex flex-col gap-10">
              {activeSection.items.map((module) => (
                <div key={module.name} className="space-y-6">
                  {/* Module Title & Meta */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-black rounded-lg text-white shadow-md">
                        <module.icon size={18} strokeWidth={3} />
                      </div>
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">{module.name}</h3>
                    </div>
                    
                    <p className="text-xs font-bold text-black/40 pl-3 border-l-2 border-black/5">
                      {module.desc}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {[
                        { label: "METHOD", value: module.method },
                        { label: "AUTH", value: module.auth }
                      ].map((pill) => (
                        <div key={pill.label} className="bg-black/5 px-3 py-1 rounded-md flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-black/30">{pill.label}:</span>
                          <span className="text-[9px] font-black uppercase text-black/60">{pill.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Output */}
                  <TerminalSnippet 
                    command={module.terminal.cmd}
                    output=""
                    bgImage={activeSection.bgImage}
                    file={module.terminal.file}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  const [theme, setTheme] = useState<Theme>({
    canvas: "#efefed",
    primary: "#111111",
    grid: "rgba(0,0,0,0.03)",
    gridSize: 24
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-canvas', theme.canvas);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-grid', theme.grid);
    root.style.setProperty('--theme-grid-size', `${theme.gridSize}px`);
  }, [theme]);

  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  return (
    <>
      <div className="noise-texture min-h-screen pt-[160px] pb-24 px-8 flex justify-center transition-colors duration-500">
        <Navbar 
          activePage={currentPage} 
          onNavigate={setCurrentPage} 
        />
        
        <main className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {currentPage === "home" ? (
              <motion.div 
                key="home"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex justify-center"
            >
              <HomeView />
            </motion.div>
          ) : (
            <motion.div 
              key="apis"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full flex justify-center"
            >
              <APIsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Blur Backgrounds */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-100 rounded-full blur-[160px] opacity-20 pointer-events-none" />

      <div className="fixed inset-0 pointer-events-none z-[190] opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0 bg-[#efefed] mix-blend-overlay"></div>
      </div>
    </div>
    </>
  );
}
