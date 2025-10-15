'use client';

import { useState, useEffect, useRef } from 'react';
import './morse.css';

interface ConversionHistoryItem {
  input: string;
  output: string;
  mode: 'textToMorse' | 'morseToText';
  timestamp: string;
}

export default function Home() {
  return <MorseCodeConverter />;
}

function MorseCodeConverter() {
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
  const [isConverting, setIsConverting] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [stats, setStats] = useState({ totalConversions: 0, charactersConverted: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<{oscillators: OscillatorNode[], gainNodes: GainNode[]}>({oscillators: [], gainNodes: []});

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
  }, [inputText]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleModeChange = (mode: 'textToMorse' | 'morseToText') => {
    setCurrentMode(mode);
    setOutputText(mode === 'textToMorse' 
      ? 'Your converted Morse code will appear here...' 
      : 'Your decoded text will appear here...');
  };

  const handleConvert = () => {
    const input = inputText.trim();
    if (!input) {
      setOutputText('Please enter some text to convert.');
      return;
    }

    setIsConverting(true);
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
      setIsConverting(false);
      
      if (result && input) {
        addToHistory(input, result, currentMode);
        updateStats(input.length);
      }
      
      // Audio playback is now manual only - removed automatic playback
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
    if (outputText && outputText !== 'Your converted text will appear here...' && outputText !== 'Your converted Morse code will appear here...' && outputText !== 'No valid conversion found.' && outputText !== 'Your decoded text will appear here...') {
      const temp = inputText;
      setInputText(outputText);
      setOutputText(temp);
      handleModeChange(currentMode === 'textToMorse' ? 'morseToText' : 'textToMorse');
    }
  };

  const loadFromHistory = (input: string, mode: 'textToMorse' | 'morseToText') => {
    setInputText(input);
    if (mode !== currentMode) {
      handleModeChange(mode);
    }
    setTimeout(() => handleConvert(), 100);
  };

  const clearHistory = () => {
    setConversionHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('morseHistory');
    }
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
          
          {/* Stats Display */}
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
        </div>

        {/* Theme Toggle */}
        {mounted && (
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
          <div className="char-counter">{charCount} character{charCount !== 1 ? 's' : ''}</div>
          
          <div className="quick-actions">
            <button className="quick-btn" onClick={handleSample}>📝 Try Sample</button>
            <button className="quick-btn" onClick={handleSwap}>🔄 Swap Input/Output</button>
            <button className="quick-btn" onClick={() => setInputText(inputText.toUpperCase())}>🔤 UPPERCASE</button>
            <button className="quick-btn" onClick={() => setInputText(inputText.toLowerCase())}>🔡 lowercase</button>
          </div>
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
                {isPlaying ? '⏸️ Playing...' : (soundEnabled ? '▶️ Play Audio' : '🔇 Sound Disabled')}
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
            </div>
          </div>
        )}

        <button className={`convert-btn ${isConverting ? 'converting' : ''}`} onClick={handleConvert}>
          {isConverting ? '⏳ Converting...' : '🔄 Convert'}
        </button>

        <div className="output-section">
          <div className="output-label">
            <span>{currentMode === 'textToMorse' ? '📤 Morse Code:' : '📝 Decoded Text:'}</span>
            <button className="copy-btn" onClick={handleCopy}>📋 Copy</button>
            <button className="download-btn" onClick={handleDownload}>💾 Download</button>
            <button className="clear-btn" onClick={handleClear}>🗑️ Clear</button>
          </div>
          <div className="output-text">{outputText}</div>
        </div>

        <div className="history-section">
          <div className="history-header">
            <span className="history-title">📚 Recent Conversions</span>
            <button className="clear-history-btn" onClick={clearHistory}>Clear History</button>
          </div>
          <div className="history-list">
            {conversionHistory.length === 0 ? (
              <p className="empty-history">No conversions yet</p>
            ) : (
              conversionHistory.map((item, index) => (
                <div
                  key={index}
                  className="history-item"
                  onClick={() => loadFromHistory(item.input, item.mode)}
                >
                  <div className="history-badge">{item.mode === 'textToMorse' ? '📝→⚡' : '⚡→📝'}</div>
                  <div className="history-content">
                    <div className="history-input">
                      {item.input.substring(0, 50)}{item.input.length > 50 ? '...' : ''}
                    </div>
                    <div className="history-output">
                      {item.output.substring(0, 50)}{item.output.length > 50 ? '...' : ''}
                    </div>
                    <div className="history-time">{item.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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

        {/* Features showcase */}
        <div className="features-section">
          <h3 className="features-title">✨ Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-name">Instant Conversion</div>
              <div className="feature-desc">Lightning-fast conversion between text and Morse code</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔊</div>
              <div className="feature-name">Audio Playback</div>
              <div className="feature-desc">Listen to Morse code with adjustable speed (1-10 WPM)</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <div className="feature-name">Conversion History</div>
              <div className="feature-desc">Keep track of your last 10 conversions</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <div className="feature-name">5 Themes</div>
              <div className="feature-desc">Choose from light, dark, ocean, sunset, or forest themes</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <div className="feature-name">Download Results</div>
              <div className="feature-desc">Save your conversions as text files</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <div className="feature-name">Mobile Friendly</div>
              <div className="feature-desc">Fully responsive Material Design 3 interface</div>
            </div>
          </div>
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

      <div className={`notification ${showNotification ? 'show' : ''}`}>
        {notificationText}
      </div>
    </>
  );
}

