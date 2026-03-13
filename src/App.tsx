import React, { useState, useEffect } from 'react';
import { Volume2, ArrowRightLeft, Copy, Check, Square, Sparkles, ArrowRight, ArrowLeft, Lightbulb, RefreshCw, Settings, ExternalLink, Key } from 'lucide-react';
import './App.css';
import { translateToMalayalam, getRandomKeralaFact } from './lib/gemini';

const FilterCoffeeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Tumbler (Top Glass) */}
    <path d="M7 3L8 16H16L17 3H7Z" fill="#6F4E37" stroke="#3E2723" strokeWidth="1.5" />
    <path d="M7.5 5H16.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" />
    {/* Davara (Bottom Cup) */}
    <path d="M4 16C4 16 4 21 12 21C20 21 20 16 20 16H4Z" fill="#D4AF37" stroke="#3E2723" strokeWidth="1.5" />
    {/* Steam logic */}
    <path d="M10 1L10.5 2.5" stroke="#6F4E37" strokeLinecap="round" opacity="0.6" />
    <path d="M14 1L13.5 2.5" stroke="#6F4E37" strokeLinecap="round" opacity="0.6" />
  </svg>
);

function App() {
  const [view, setView] = useState<'HOME' | 'TRANSLATE' | 'SETUP' | 'SETTINGS'>('HOME');
  const [apiKey, setApiKey] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [factLoading, setFactLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentFact, setCurrentFact] = useState({
    fact: "Kerala's traditional snake boat races (Vallam Kali) feature boats over 100 feet long!",
    word: "Boat",
    translation: "വള്ളം (Vallam)"
  });

  useEffect(() => {
    // Load API Key from chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['dravida_api_key'], (result) => {
        const key = result.dravida_api_key as string | undefined;
        if (key) {
          setApiKey(key);
          fetchNewFact(false, key);
        } else {
          setView('SETUP');
        }
      });
    }
  }, []);

  const saveApiKey = (key: string) => {
    if (key.trim().length < 10) return;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ dravida_api_key: key }, () => {
        setApiKey(key);
        setView('HOME');
        fetchNewFact(true, key);
      });
    }
  };

  const fetchNewFact = async (forceArea = false, keyOverride?: string) => {
    const activeKey = keyOverride || apiKey;
    if (!activeKey) return;

    // Check cache first if not forced
    if (!forceArea) {
      const cached = localStorage.getItem('mk_daily_fact');
      const cachedTime = localStorage.getItem('mk_fact_timestamp');

      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        const oneDay = 24 * 60 * 60 * 1000;
        if (age < oneDay) {
          setCurrentFact(JSON.parse(cached));
          return;
        }
      }
    }

    setFactLoading(true);
    try {
      const newFact = await getRandomKeralaFact(activeKey);
      setCurrentFact(newFact);
      // Save to cache
      localStorage.setItem('mk_daily_fact', JSON.stringify(newFact));
      localStorage.setItem('mk_fact_timestamp', Date.now().toString());
    } catch (err) {
      console.error(err);
    } finally {
      setFactLoading(false);
    }
  };

  const resetTranslator = () => {
    setInputText('');
    setTranslatedText('');
    setView('HOME');
  };

  const handleTranslate = async (overrideText?: string) => {
    const textToTranslate = overrideText || inputText;
    if (!textToTranslate.trim() || loading) return;

    if (view === 'HOME') setView('TRANSLATE');
    if (overrideText) setInputText(overrideText);

    setLoading(true);
    setCopied(false);
    try {
      const result = await translateToMalayalam(textToTranslate, apiKey);
      setTranslatedText(result);
    } catch (err: any) {
      setTranslatedText(`Error: ${err.message || 'Could not translate.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const playPronunciation = (text: string) => {
    if (currentAudio) {
      currentAudio.pause();
    }

    const malayalamOnly = text.split('(')[0].trim();
    const encodedText = encodeURIComponent(malayalamOnly);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ml&client=tw-ob`;

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      setCurrentAudio(null);
    };
    audio.onerror = () => {
      setIsSpeaking(false);
      setCurrentAudio(null);
    };

    audio.play();
  };

  const stopPronunciation = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-container">
      <header className="header">
        <button
          className="settings-btn"
          onClick={() => setView('SETTINGS')}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
        >
          <Settings size={20} />
        </button>
        <div className="brand-group center-all">
          <div className="custom-logo">🌴</div>
          <h1>DravidaTalk</h1>
          <p className="tagline">Learn Malayalam, Feel Kerala</p>
        </div>
      </header>

      <main className="main-content">
        {view === 'HOME' ? (
          <div className="home-screen animate-fade-in">
            <div className="welcome-box">
              <h2>Namaskaram 🙏</h2>
              <p>Your cultural bridge to the backwaters. Experience Kerala through its beautiful language.</p>
            </div>

            <div className="fact-card">
              <div className="fact-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={14} />
                  <span>Did you know?</span>
                </div>
                <button
                  onClick={() => fetchNewFact(true)}
                  className="action-btn"
                  style={{ background: 'rgba(255,255,255,0.1)', padding: '4px', color: 'white' }}
                  disabled={factLoading}
                >
                  <RefreshCw size={14} className={factLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              <p className="fact-content">{factLoading ? "Summoning a new fact..." : `"${currentFact.fact}"`}</p>
              <div className="fact-prompt">
                <Sparkles size={14} />
                <span>{factLoading ? "Finding a word..." : `Learn how to say "${currentFact.word}"`}</span>
              </div>
              <button
                className="start-btn"
                style={{ background: 'white', color: 'var(--primary)', marginTop: '16px' }}
                disabled={factLoading}
                onClick={() => handleTranslate(currentFact.word)}
              >
                Show Translation <ArrowRight size={18} />
              </button>
            </div>

            <button className="start-btn" onClick={() => setView('TRANSLATE')}>
              Go to Translator <ArrowRight size={18} />
            </button>
          </div>
        ) : view === 'SETUP' || view === 'SETTINGS' ? (
          <div className="setup-screen animate-fade-in">
            <div className="welcome-box" style={{ marginBottom: '24px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="var(--accent)" />
                {view === 'SETUP' ? 'AI Setup' : 'Settings'}
              </h2>
              <p>To keep DravidaTalk free, please provide your own Google Gemini API key.</p>
            </div>

            <div className="input-section" style={{ background: 'white', padding: '20px', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow)', border: '1px solid #eee' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>GEMINI API KEY</label>
              <input
                type="password"
                placeholder="Paste key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '16px', outline: 'none' }}
              />
              <button
                className="start-btn"
                style={{ width: '100%' }}
                onClick={() => saveApiKey(apiKey)}
              >
                Save & Continue <Check size={18} />
              </button>
            </div>

            <div className="welcome-box" style={{ marginTop: '24px', background: 'rgba(212, 175, 55, 0.1)', border: '1px dashed var(--accent)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '8px' }}>How to get a key?</h3>
              <p style={{ fontSize: '0.8rem' }}>It takes 30 seconds and it's free!</p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', textDecoration: 'none' }}
              >
                Get your Free API Key <ExternalLink size={14} />
              </a>
            </div>

            <div className="welcome-box" style={{ marginTop: '24px', background: 'rgba(111, 78, 55, 0.08)', border: '1px solid rgba(111, 78, 55, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FilterCoffeeIcon size={20} />
                <h3 style={{ fontSize: '0.9rem', color: '#3E2723', margin: 0 }}>Support DravidaTalk</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#5D4037', marginBottom: '12px' }}>Love the way you learn? Support the developer by buying a traditional Filter Coffee!</p>
              <a
                href="https://www.buymeacoffee.com/anushavenna"
                target="_blank"
                rel="noreferrer"
                className="coffee-btn"
                style={{
                  background: '#6F4E37',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 10px rgba(111, 78, 55, 0.15)'
                }}
              >
                Buy me a Filter Coffee ☕
              </a>
            </div>

            {view === 'SETTINGS' && (
              <button
                className="back-btn"
                onClick={() => setView('HOME')}
                style={{ marginTop: '20px' }}
              >
                <ArrowLeft size={16} /> Back to Home
              </button>
            )}
          </div>
        ) : (
          <div className="translator-screen animate-fade-in">
            <button className="back-btn" onClick={resetTranslator}>
              <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="input-section">
              <textarea
                autoFocus
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type in Telugu or English..."
                className="text-input"
              />
              <button
                onClick={() => handleTranslate()}
                disabled={loading}
                className="translate-btn"
              >
                {loading ? <RefreshCw size={24} className="animate-spin" /> : <ArrowRightLeft size={24} />}
              </button>
            </div>

            {translatedText && (
              <div className="result-section animate-fade-in">
                <div className="result-header">
                  <span>Malayalam Translation</span>
                  <div className="result-actions">
                    <button
                      onClick={copyToClipboard}
                      className="action-btn"
                      title="Copy Translation"
                    >
                      {copied ? <Check size={18} color="#059669" /> : <Copy size={18} />}
                    </button>
                    {isSpeaking ? (
                      <button
                        onClick={stopPronunciation}
                        className="action-btn"
                        title="Stop Audio"
                      >
                        <Square size={18} fill="#ef4444" stroke="#ef4444" />
                      </button>
                    ) : (
                      <button
                        onClick={() => playPronunciation(translatedText)}
                        className="action-btn"
                        title="Hear Pronunciation"
                      >
                        <Volume2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="result-text">{translatedText.split('(')[0].trim()}</p>
                {translatedText.includes('(') && (
                  <p className="transliteration">
                    {translatedText.split('(')[1].replace(')', '')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Learn Malayalam • Feel Kerala</p>
        <p style={{ fontSize: '0.6rem', marginTop: '4px', opacity: 0.8 }}>DravidaTalk: Bridging the South</p>
      </footer>
    </div>
  );
}

export default App;
