'use client';

import { useState, useEffect, useRef } from 'react';
import './morse.css';
import { useAuth } from '@/hooks/useAuth';

interface ConversionHistoryItem {
  input: string;
  output: string;
  mode: 'textToMorse' | 'morseToText';
  timestamp: string;
}

export default function Home() {
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return <MorseCodeConverter />;
}

function MorseCodeConverter() {
  const { user, loading, login, logout } = useAuth();
  const [currentMode, setCurrentMode] = useState<'textToMorse' | 'morseToText'>('textToMorse');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('Your converted text will appear here...');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speed, setSpeed] = useState(5);
  const [charCount, setCharCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('Copied to clipboard!');
  const [conversionHistory, setConversionHistory] = useState<ConversionHistoryItem[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [showReferenceSidebar, setShowReferenceSidebar] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [stats, setStats] = useState({ totalConversions: 0, charactersConverted: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{oscillators: OscillatorNode[], gainNodes: GainNode[]}>({oscillators: [], gainNodes: []});
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vibrateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const morseCode = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..",
    ".---", "-.-", ".-..", "--", "-.", "---",
    ".--.", "--.-", ".-.", "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--.."];

  const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
    "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
  
  const numbers: { [key: string]: string } = {
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };
  
  const punctuation: { [key: string]: string } = {
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
    '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
    '$': '...-..-', '@': '.--.-.'
  };

  useEffect(() => {
    setMounted(true);
    // Only access localStorage on client-side
    const savedTheme = localStorage.getItem('morseTheme') as 'light' | 'dark' | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    const savedSound = localStorage.getItem('morseSound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
    
    const savedHistory = JSON.parse(localStorage.getItem('morseHistory') || '[]');
    setConversionHistory(savedHistory);
    
    const savedStats = JSON.parse(localStorage.getItem('morseStats') || '{"totalConversions":0,"charactersConverted":0}');
    setStats(savedStats);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('morseTheme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    setCharCount(inputText.length);
    
    // Real-time conversion as you type
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      setOutputText(currentMode === 'textToMorse' 
        ? 'Your converted Morse code will appear here...' 
        : 'Your decoded text will appear here...');
      return;
    }

    let result = '';

    if (currentMode === 'textToMorse') {
      const words = trimmedInput.toLowerCase().split(/\s+/);
      for (let w = 0; w < words.length; w++) {
        for (const char of words[w]) {
          const index = alphabet.indexOf(char);
          if (index !== -1) {
            result += morseCode[index] + ' ';
          } else if (numbers[char]) {
            result += numbers[char] + ' ';
          } else if (punctuation[char]) {
            result += punctuation[char] + ' ';
          }
        }
        if (w < words.length - 1) {
          result += '  ';
        }
      }
      result = result.trim();
    } else {
      const words = trimmedInput.split(/\s{3,}/);
      for (let w = 0; w < words.length; w++) {
        const letters = words[w].trim().split(/\s+/);
        for (const symbol of letters) {
          const index = morseCode.indexOf(symbol);
          if (index !== -1) {
            result += alphabet[index];
          } else {
            // Check numbers
            for (const [num, morse] of Object.entries(numbers)) {
              if (morse === symbol) {
                result += num;
                break;
              }
            }
            // Check punctuation
            for (const [punct, morse] of Object.entries(punctuation)) {
              if (morse === symbol) {
                result += punct;
                break;
              }
            }
          }
        }
        if (w < words.length - 1) {
          result += ' ';
        }
      }
    }

    setOutputText(result || 'No valid conversion found.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, currentMode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleModeChange = (mode: 'textToMorse' | 'morseToText') => {
    setCurrentMode(mode);
    setInputText('');
    setOutputText(mode === 'textToMorse' 
      ? 'Your converted Morse code will appear here...' 
      : 'Your decoded text will appear here...');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to clear
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setInputText('');
        setOutputText(currentMode === 'textToMorse' 
          ? 'Your converted Morse code will appear here...'
          : 'Your decoded text will appear here...');
      }
      // Escape to close sidebar
      if (e.key === 'Escape' && showReferenceSidebar) {
        setShowReferenceSidebar(false);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [showReferenceSidebar, currentMode]);

  const handleConvert = () => {
    const input = inputText.trim();
    if (!input) {
      setOutputText('Please enter some text to convert.');
      return;
    }

    let result = '';

    if (currentMode === 'textToMorse') {
      const words = input.toLowerCase().split(/\s+/);
      for (let w = 0; w < words.length; w++) {
        for (const char of words[w]) {
          const index = alphabet.indexOf(char);
          if (index !== -1) {
            result += morseCode[index] + ' ';
          } else if (numbers[char]) {
            result += numbers[char] + ' ';
          } else if (punctuation[char]) {
            result += punctuation[char] + ' ';
          }
        }
        if (w < words.length - 1) {
          result += '  ';
        }
      }
      result = result.trim();
    } else {
      const words = input.split(/\s{3,}/);
      for (let w = 0; w < words.length; w++) {
        const letters = words[w].trim().split(/\s+/);
        for (const symbol of letters) {
          const index = morseCode.indexOf(symbol);
          if (index !== -1) {
            result += alphabet[index];
          } else {
            // Check numbers
            for (const [num, morse] of Object.entries(numbers)) {
              if (morse === symbol) {
                result += num;
                break;
              }
            }
            // Check punctuation
            for (const [punct, morse] of Object.entries(punctuation)) {
              if (morse === symbol) {
                result += punct;
                break;
              }
            }
          }
        }
        if (w < words.length - 1) {
          result += ' ';
        }
      }
    }

    setTimeout(() => {
      setOutputText(result || 'No valid conversion found.');
      
      if (result && input) {
        addToHistory(input, result, currentMode);
        updateStats(input.length);
      }
    }, 300);
  };

  const updateStats = (charCount: number) => {
    const newStats = {
      totalConversions: stats.totalConversions + 1,
      charactersConverted: stats.charactersConverted + charCount
    };
    setStats(newStats);
    if (typeof window !== 'undefined') {
      localStorage.setItem('morseStats', JSON.stringify(newStats));
    }
  };

  const addToHistory = (input: string, output: string, mode: 'textToMorse' | 'morseToText') => {
    const historyItem: ConversionHistoryItem = {
      input,
      output,
      mode,
      timestamp: new Date().toLocaleString()
    };
    
    const newHistory = [historyItem, ...conversionHistory].slice(0, 10);
    setConversionHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('morseHistory', JSON.stringify(newHistory));
    }
  };

  const playMorseSound = (morseText: string) => {
    if (!soundEnabled || currentMode !== 'textToMorse' || isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const audioContext = audioContextRef.current;
      const dotLength = 60 / (speed * 5);
      const dashLength = dotLength * 3;
      const letterGap = dotLength * 3;
      
      // Clear previous audio nodes
      audioNodesRef.current = {oscillators: [], gainNodes: []};
      
      let currentTime = audioContext.currentTime;
      let totalDuration = 0;
      
      for (const char of morseText) {
        if (char === '.') {
          playTone(audioContext, currentTime, dotLength, 800);
          currentTime += dotLength + (dotLength * 0.5);
          totalDuration = currentTime - audioContext.currentTime;
        } else if (char === '-') {
          playTone(audioContext, currentTime, dashLength, 800);
          currentTime += dashLength + (dotLength * 0.5);
          totalDuration = currentTime - audioContext.currentTime;
        } else if (char === ' ') {
          currentTime += letterGap;
          totalDuration = currentTime - audioContext.currentTime;
        }
      }
      
      // Auto-stop when finished
      setTimeout(() => {
        setIsPlaying(false);
      }, totalDuration * 1000);
      
    } catch {
      console.log('Audio not supported');
      setIsPlaying(false);
    }
  };

  const stopMorseSound = () => {
    if (audioContextRef.current) {
      // Stop all oscillators
      audioNodesRef.current.oscillators.forEach(osc => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      
      // Clear the arrays
      audioNodesRef.current = {oscillators: [], gainNodes: []};
    }
    setIsPlaying(false);
  };

  const playTone = (audioContext: AudioContext, startTime: number, duration: number, frequency: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.1, startTime);
    gainNode.gain.setValueAtTime(0, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
    
    // Store references for stopping
    audioNodesRef.current.oscillators.push(oscillator);
    audioNodesRef.current.gainNodes.push(gainNode);
  };

  // Flashlight morse code
  const playMorseFlashlight = async (morseText: string) => {
    if (isFlashing || currentMode !== 'textToMorse') return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = stream.getVideoTracks()[0];
      
      // Type assertion for MediaStreamTrack with torch capability
      interface MediaTrackCapabilities {
        torch?: boolean;
      }
      
      if (!track.getCapabilities || !(track.getCapabilities() as MediaTrackCapabilities).torch) {
        showNotificationMessage('Flashlight not supported');
        track.stop();
        return;
      }

      setIsFlashing(true);
      const dotLength = 60 / (speed * 5) * 1000; // Convert to milliseconds
      const dashLength = dotLength * 3;
      const letterGap = dotLength * 3;

      const flashSequence = async () => {
        for (const char of morseText) {
          if (!isFlashing) break;
          
          if (char === '.') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ torch: true }] });
            await new Promise(resolve => setTimeout(resolve, dotLength));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ torch: false }] });
            await new Promise(resolve => setTimeout(resolve, dotLength * 0.5));
          } else if (char === '-') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ torch: true }] });
            await new Promise(resolve => setTimeout(resolve, dashLength));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (track as any).applyConstraints({ advanced: [{ torch: false }] });
            await new Promise(resolve => setTimeout(resolve, dotLength * 0.5));
          } else if (char === ' ') {
            await new Promise(resolve => setTimeout(resolve, letterGap));
          }
        }
        
        setIsFlashing(false);
        track.stop();
      };

      flashSequence();
    } catch (error) {
      console.error('Flashlight error:', error);
      showNotificationMessage('Flashlight not available');
      setIsFlashing(false);
    }
  };

  const stopMorseFlashlight = () => {
    setIsFlashing(false);
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
    }
  };

  // Vibration morse code
  const playMorseVibration = (morseText: string) => {
    if (isVibrating || currentMode !== 'textToMorse') return;
    
    if (!navigator.vibrate) {
      showNotificationMessage('Vibration not supported');
      return;
    }

    setIsVibrating(true);
    const dotLength = 60 / (speed * 5) * 1000; // Convert to milliseconds
    const dashLength = dotLength * 3;
    const letterGap = dotLength * 3;

    const pattern: number[] = [];
    
    for (const char of morseText) {
      if (char === '.') {
        pattern.push(dotLength, dotLength * 0.5);
      } else if (char === '-') {
        pattern.push(dashLength, dotLength * 0.5);
      } else if (char === ' ') {
        pattern.push(0, letterGap);
      }
    }

    navigator.vibrate(pattern);
    
    // Calculate total duration and auto-stop
    const totalDuration = pattern.reduce((sum, val) => sum + val, 0);
    setTimeout(() => {
      setIsVibrating(false);
    }, totalDuration);
  };

  const stopMorseVibration = () => {
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    setIsVibrating(false);
    if (vibrateIntervalRef.current) {
      clearInterval(vibrateIntervalRef.current);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      showNotificationMessage('Copied to clipboard!');
    } catch {
      showNotificationMessage('Copied to clipboard!');
    }
  };

  const handleDownload = () => {
    const content = `Input: ${inputText}\nOutput: ${outputText}\nMode: ${currentMode === 'textToMorse' ? 'Text to Morse' : 'Morse to Text'}\nDate: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morse-conversion-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotificationMessage('Downloaded!');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Morse Code Conversion',
      text: `${currentMode === 'textToMorse' ? 'Text' : 'Morse'}: ${inputText}\n${currentMode === 'textToMorse' ? 'Morse' : 'Text'}: ${outputText}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showNotificationMessage('Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n\nConvert your own text at ${shareData.url}`);
        showNotificationMessage('Link copied to clipboard!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotificationMessage('Share failed');
      }
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setInputText(text);
        showNotificationMessage('File imported!');
      }
    };
    input.click();
  };

  const showNotificationMessage = (message: string) => {
    setNotificationText(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText(currentMode === 'textToMorse' 
      ? 'Your converted Morse code will appear here...'
      : 'Your decoded text will appear here...');
  };

  const handleSample = () => {
    if (currentMode === 'textToMorse') {
      setInputText('Hello World! This is a Morse code converter.');
    } else {
      setInputText('.... . .-.. .-.. ---   .-- --- .-. .-.. -.. -.-.--   - .... .. ...   .. ...   .-   -- --- .-. ... .   -.-. --- -.. .   -.-. --- -. ...- . .-. - . .-. .-.-.-');
    }
  };

  const handleSwap = () => {
    // Swap input and output, then toggle the mode
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
    // Toggle mode
    const newMode = currentMode === 'textToMorse' ? 'morseToText' : 'textToMorse';
    handleModeChange(newMode);
  };

  const loadFromHistory = (input: string, mode: 'textToMorse' | 'morseToText') => {
    setInputText(input);
    if (mode !== currentMode) {
      handleModeChange(mode);
    }
    setTimeout(() => handleConvert(), 100);
  };

  const deleteHistoryItem = (index: number) => {
    const newHistory = conversionHistory.filter((_, i) => i !== index);
    setConversionHistory(newHistory);
    if (typeof window !== 'undefined') {
      localStorage.setItem('morseHistory', JSON.stringify(newHistory));
    }
    showNotificationMessage('Deleted from history');
  };

  const clearHistory = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000); // Reset after 3 seconds
      return;
    }
    
    setConversionHistory([]);
    setShowClearConfirm(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('morseHistory');
    }
    showNotificationMessage('History cleared!');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        showNotificationMessage('Fullscreen not supported');
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <>
      <div className="container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="app-icon">
            <svg width="80" height="80" viewBox="0 0 527 527" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="263.5" cy="263.5" r="253.5" stroke="currentColor" strokeWidth="20"/>
              <line x1="241.5" y1="140" x2="285.5" y2="140" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
              <line x1="220.5" y1="180" x2="250.5" y2="180" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
              <line x1="276.5" y1="180" x2="306.5" y2="180" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
              <circle cx="263.5" cy="220" r="10" fill="currentColor"/>
              <line x1="220.5" y1="370" x2="306.5" y2="370" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Morse Code Converter</h1>
          <p className="subtitle">Convert between text and Morse code instantly</p>
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <>
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Auth Button */}
            {!loading && (
              <button 
                className="auth-button" 
                onClick={user ? logout : login}
                aria-label={user ? 'Sign out' : 'Sign in'}
              >
                {user ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="auth-email">{user.email}</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a 2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="10 17 15 12 10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Sign In
                  </>
                )}
              </button>
            )}
          </>
        )}

        <div className="mode-selector">
          <button
            className={`mode-btn ${currentMode === 'textToMorse' ? 'active' : ''}`}
            onClick={() => handleModeChange('textToMorse')}
          >
            📝 Text → Morse
          </button>
          <button
            className={`mode-btn ${currentMode === 'morseToText' ? 'active' : ''}`}
            onClick={() => handleModeChange('morseToText')}
          >
            ⚡ Morse → Text
          </button>
        </div>

        <div className="input-section">
          <label htmlFor="inputText">
            {currentMode === 'textToMorse' 
              ? 'Enter text to convert:' 
              : 'Enter Morse code (spaces between letters, triple spaces between words):'}
          </label>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={currentMode === 'textToMorse' 
              ? 'Type your text here...' 
              : '.... . .-.. .-.. ---   .-- --- .-. .-.. -..'}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleConvert();
              }
            }}
          />
          <div className="input-footer">
            <div className="char-counter">{charCount} character{charCount !== 1 ? 's' : ''}</div>
            <div className="quick-actions">
              <button className="quick-btn" onClick={handleImport} title="Import text from file">📂 Import</button>
              <button className="quick-btn" onClick={handleSample} title="Try a sample text">📝 Sample</button>
              <button className="quick-btn" onClick={handleSwap} title="Swap input and output">🔄 Swap</button>
            </div>
          </div>
        </div>

        {/* Stats Display - Moved below input */}
        <div className="stats-bar">
          <div className="stat-item">
            <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 1L21 5M21 5L17 9M21 5H9C5.13401 5 2 8.13401 2 12C2 15.866 5.13401 19 9 19H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="stat-info">
              <div className="stat-value">{stats.totalConversions}</div>
              <div className="stat-label">Conversions</div>
            </div>
          </div>
          <div className="stat-item">
            <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="stat-info">
              <div className="stat-value">{stats.charactersConverted}</div>
              <div className="stat-label">Characters</div>
            </div>
          </div>
        </div>

        {/* Output Section - Moved up for visibility */}
        <div className="output-section">
          <div className="output-label">
            <span>{currentMode === 'textToMorse' ? '📤 Morse Code:' : '📝 Decoded Text:'}</span>
            <button className="copy-btn" onClick={handleCopy}>📋 Copy</button>
            <button className="download-btn" onClick={handleShare}>📤 Share</button>
            <button className="download-btn" onClick={handleDownload}>💾 Download</button>
            <button className="clear-btn" onClick={handleClear}>🗑️ Clear</button>
          </div>
          <div className="output-text">{outputText}</div>
        </div>

        {currentMode === 'textToMorse' && outputText && outputText !== 'Your converted Morse code will appear here...' && outputText !== 'No valid conversion found.' && (
          <div className="audio-control-section">
            <div className="speed-control">
              <span className="speed-label">🎵 Playback Speed:</span>
              <input
                type="range"
                className="speed-slider"
                min="1"
                max="10"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                aria-label="Morse code playback speed"
              />
              <span className="speed-value">{speed} WPM</span>
            </div>
            <div className="audio-buttons">
              <button 
                className={`play-audio-btn ${isPlaying ? 'playing' : ''}`}
                onClick={() => soundEnabled && !isPlaying && playMorseSound(outputText)}
                disabled={!soundEnabled || isPlaying}
                title={soundEnabled ? (isPlaying ? "Playing..." : "Play Morse code audio") : "Enable sound first"}
              >
                {isPlaying ? '⏸️ Playing...' : (soundEnabled ? '▶️ Audio' : '🔇 Sound Disabled')}
              </button>
              {isPlaying && (
                <button 
                  className="stop-audio-btn"
                  onClick={stopMorseSound}
                  title="Stop audio playback"
                >
                  ⏹️ Stop
                </button>
              )}
              
              <button 
                className={`play-audio-btn ${isFlashing ? 'playing' : ''}`}
                onClick={() => !isFlashing && playMorseFlashlight(outputText)}
                disabled={isFlashing}
                title={isFlashing ? "Flashing..." : "Flash Morse code with flashlight"}
              >
                {isFlashing ? '⏸️ Flashing...' : '🔦 Flashlight'}
              </button>
              {isFlashing && (
                <button 
                  className="stop-audio-btn"
                  onClick={stopMorseFlashlight}
                  title="Stop flashlight"
                >
                  ⏹️ Stop
                </button>
              )}
              
              <button 
                className={`play-audio-btn ${isVibrating ? 'playing' : ''}`}
                onClick={() => !isVibrating && playMorseVibration(outputText)}
                disabled={isVibrating}
                title={isVibrating ? "Vibrating..." : "Vibrate Morse code"}
              >
                {isVibrating ? '⏸️ Vibrating...' : '📳 Vibrate'}
              </button>
              {isVibrating && (
                <button 
                  className="stop-audio-btn"
                  onClick={stopMorseVibration}
                  title="Stop vibration"
                >
                  ⏹️ Stop
                </button>
              )}
            </div>
          </div>
        )}

        {inputText && outputText && outputText !== 'Your converted Morse code will appear here...' && outputText !== 'Your decoded text will appear here...' && outputText !== 'No valid conversion found.' && (
          <button className="convert-btn" onClick={() => {
            addToHistory(inputText, outputText, currentMode);
            updateStats(inputText.length);
            showNotificationMessage('Saved to history!');
          }}>
            � Save to History
          </button>
        )}

        {/* History Modal - Hidden by default */}
        {showHistoryModal && (
          <>
            <div className="history-modal">
              <div className="history-modal-content">
                <div className="history-header">
                  <span className="history-title">📚 Recent Conversions</span>
                  <div>
                    <button 
                      className={`clear-history-btn ${showClearConfirm ? 'confirm' : ''}`}
                      onClick={clearHistory}
                    >
                      {showClearConfirm ? '⚠️ Click Again to Confirm' : '🗑️ Clear All'}
                    </button>
                    <button className="close-sidebar-btn" onClick={() => setShowHistoryModal(false)}>✕</button>
                  </div>
                </div>
                <div className="history-list">
                  {conversionHistory.length === 0 ? (
                    <p className="empty-history">No conversions yet</p>
                  ) : (
                    conversionHistory.map((item, index) => (
                      <div
                        key={index}
                        className="history-item"
                      >
                        <div className="history-badge">{item.mode === 'textToMorse' ? '📝→⚡' : '⚡→📝'}</div>
                        <div 
                          className="history-content"
                          onClick={() => {
                            loadFromHistory(item.input, item.mode);
                            setShowHistoryModal(false);
                          }}
                        >
                          <div className="history-input">
                            {item.input.substring(0, 50)}{item.input.length > 50 ? '...' : ''}
                          </div>
                          <div className="history-output">
                            {item.output.substring(0, 50)}{item.output.length > 50 ? '...' : ''}
                          </div>
                          <div className="history-time">{item.timestamp}</div>
                        </div>
                        <button 
                          className="delete-history-item-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(index);
                          }}
                          title="Delete this item"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="sidebar-overlay" onClick={() => setShowHistoryModal(false)} />
          </>
        )}

        <div className="help-section">
          <div className="help-header">
            <div className="help-title">
              <span>💡 How to use</span>
            </div>
            <button className="chart-toggle-btn" onClick={() => setShowChart(!showChart)}>
              {showChart ? '📖 Hide Chart' : '📊 Show Chart'}
            </button>
          </div>
          <ul className="help-list">
            <li><strong>Text → Morse:</strong> Type any text (letters, numbers, punctuation) and click convert</li>
            <li><strong>Morse → Text:</strong> Use single spaces between letters, triple spaces between words</li>
            <li><strong>Example Morse:</strong> &quot;.... . .-.. .-.. ---   .-- --- .-. .-.. -..&quot; = &quot;hello world&quot;</li>
            <li><strong>Keyboard Shortcut:</strong> Press Enter in the input box to convert</li>
            <li><strong>Audio Playback:</strong> Hear your Morse code with adjustable speed</li>
          </ul>

          {showChart && (
            <>
              <div className="chart-section">
                <h3 className="chart-title">📝 Letters A-Z</h3>
                <div className="morse-chart">
                  {alphabet.map((letter, index) => (
                    <div key={letter} className="morse-item" onClick={() => setInputText(inputText + letter)}>
                      <span className="letter">{letter.toUpperCase()}</span>
                      <span className="morse">{morseCode[index]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-section">
                <h3 className="chart-title">🔢 Numbers 0-9</h3>
                <div className="morse-chart">
                  {Object.entries(numbers).map(([num, morse]) => (
                    <div key={num} className="morse-item" onClick={() => setInputText(inputText + num)}>
                      <span className="letter">{num}</span>
                      <span className="morse">{morse}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-section">
                <h3 className="chart-title">✨ Punctuation</h3>
                <div className="morse-chart">
                  {Object.entries(punctuation).map(([punct, morse]) => (
                    <div key={punct} className="morse-item" onClick={() => setInputText(inputText + punct)}>
                      <span className="letter">{punct}</span>
                      <span className="morse">{morse}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      <button
        className={`sound-toggle ${!soundEnabled ? 'muted' : ''}`}
        onClick={() => {
          setSoundEnabled(!soundEnabled);
          if (typeof window !== 'undefined') {
            localStorage.setItem('morseSound', (!soundEnabled).toString());
          }
        }}
        title="Toggle Sound"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      <button className="fullscreen-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
        ⛶
      </button>

      {/* Reference Sidebar Toggle Button */}
      <button 
        className="reference-toggle-btn" 
        onClick={() => setShowReferenceSidebar(!showReferenceSidebar)}
        title="Morse Code Reference"
      >
        📖
      </button>

      {/* History Modal Toggle Button */}
      <button 
        className="history-toggle-btn" 
        onClick={() => setShowHistoryModal(!showHistoryModal)}
        title="Conversion History"
      >
        <span className="history-icon">📚</span>
        {conversionHistory.length > 0 && (
          <span className="history-badge-count">{conversionHistory.length}</span>
        )}
      </button>

      {/* Reference Sidebar */}
      <div className={`reference-sidebar ${showReferenceSidebar ? 'open' : ''}`}>
        <div className="reference-header">
          <h3>📖 Morse Code Reference</h3>
          <button className="close-sidebar-btn" onClick={() => setShowReferenceSidebar(false)}>✕</button>
        </div>
        
        <div className="reference-content">
          <div className="reference-section">
            <h4>📝 Letters A-Z</h4>
            <div className="reference-grid">
              {alphabet.map((letter, index) => (
                <div key={letter} className="reference-item" onClick={() => setInputText(inputText + letter)}>
                  <span className="ref-letter">{letter.toUpperCase()}</span>
                  <span className="ref-morse">{morseCode[index]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reference-section">
            <h4>🔢 Numbers 0-9</h4>
            <div className="reference-grid">
              {Object.entries(numbers).map(([num, morse]) => (
                <div key={num} className="reference-item" onClick={() => setInputText(inputText + num)}>
                  <span className="ref-letter">{num}</span>
                  <span className="ref-morse">{morse}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {showReferenceSidebar && (
        <div className="sidebar-overlay" onClick={() => setShowReferenceSidebar(false)} />
      )}

      <div className={`notification ${showNotification ? 'show' : ''}`}>
        {notificationText}
      </div>
    </>
  );
}

