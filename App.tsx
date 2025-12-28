
import React, { useState, useCallback, useRef } from 'react';
import { generateDirectorPrompt, generateVeoVideo } from './services/geminiService';
import { VideoGenerationStatus, GenerationResult } from './types';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [status, setStatus] = useState<VideoGenerationStatus>({ step: 'idle', message: '' });
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type
      });
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const ensureApiKey = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        return true;
      }
      return true;
    } catch (err) {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey().catch(() => {});
      }
      return true;
    }
  };

  const startGeneration = async () => {
    if (!selectedImage) return;

    const hasKey = await ensureApiKey();
    if (!hasKey) return;

    try {
      setStatus({ step: 'analyzing', message: 'Director composing 5s hero sequence...' });
      
      const directorPrompt = await generateDirectorPrompt(selectedImage.data, selectedImage.mimeType);
      
      setStatus({ step: 'generating', message: 'Generating cinematic master...' });
      
      const videoUrl = await generateVeoVideo(
        directorPrompt, 
        selectedImage.data, 
        selectedImage.mimeType, 
        (msg) => setStatus(prev => ({ ...prev, message: msg }))
      );

      setResult({ videoUrl, directorPrompt });
      setStatus({ step: 'completed', message: 'Cinema master ready.' });
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_EXPIRED") {
        await window.aistudio.openSelectKey();
        setStatus({ step: 'error', message: 'Select your paid API key and retry.' });
      } else {
        setStatus({ step: 'error', message: 'Production interrupted.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050505] text-white p-4 sm:p-8">
      <header className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            LUXURY AERIAL CINEMA
          </h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-medium">
            Invisible Drone • High-End Commercial Grade
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase tracking-widest border-b border-gray-900 pb-1">
            Billing Support
          </a>
          <button onClick={() => window.aistudio.openSelectKey()} className="px-5 py-2 text-[10px] bg-white text-black font-black rounded-full hover:bg-gray-200 transition-all uppercase tracking-tighter">
            Select API Key
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-12">
        <section className="flex-1 space-y-8">
          <div className={`relative aspect-video rounded-3xl overflow-hidden border border-white/5 transition-all shadow-2xl shadow-black ${selectedImage ? 'ring-1 ring-white/10' : 'bg-[#0a0a0a] hover:bg-[#0f0f0f]'}`}>
            {selectedImage ? (
              <>
                <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="w-full h-full object-cover grayscale-[0.2]" alt="Hero Reference" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 bg-black/40 backdrop-blur-xl p-3 rounded-full hover:bg-red-500/80 transition-all border border-white/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group px-6 text-center">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div className="bg-white/5 p-6 rounded-3xl group-hover:scale-105 transition-transform mb-6 border border-white/10">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                </div>
                <span className="text-gray-300 font-semibold tracking-tight text-lg">Upload Hero Reference</span>
                <span className="text-gray-600 text-[10px] mt-3 uppercase font-black tracking-[0.2em]">Absolute Visual Truth • Ground Lock</span>
              </label>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Cinema Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 shadow-inner shadow-black">
                <span className="text-[9px] text-gray-500 block mb-1 uppercase font-black tracking-widest">Platform</span>
                <span className="font-semibold text-xs tracking-tight">Invisible Floating Camera</span>
              </div>
              <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 shadow-inner shadow-black">
                <span className="text-[9px] text-gray-500 block mb-1 uppercase font-black tracking-widest">Stabilization</span>
                <span className="font-semibold text-xs tracking-tight">Cinema-Grade Gimbal</span>
              </div>
              <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 shadow-inner shadow-black">
                <span className="text-[9px] text-gray-500 block mb-1 uppercase font-black tracking-widest">Motion Profile</span>
                <span className="font-semibold text-xs tracking-tight">Elegant 5s Reveal</span>
              </div>
              <div className="bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 shadow-inner shadow-black">
                <span className="text-[9px] text-gray-500 block mb-1 uppercase font-black tracking-widest">Lens</span>
                <span className="font-semibold text-xs tracking-tight">28mm Cinema Prime</span>
              </div>
            </div>
          </div>

          <button
            onClick={startGeneration}
            disabled={!selectedImage || (status.step !== 'idle' && status.step !== 'completed' && status.step !== 'error')}
            className={`w-full py-6 rounded-3xl font-black text-sm transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] ${
              !selectedImage ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:bg-gray-200 active:scale-[0.98] shadow-2xl shadow-white/5'
            }`}
          >
            {status.step === 'analyzing' || status.step === 'generating' || status.step === 'polling' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                Recording Cinema...
              </>
            ) : (
              <>
                Generate 5s Reveal
              </>
            )}
          </button>

          {status.message && (
            <div className={`p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.25em] animate-pulse transition-all ${
              status.step === 'error' ? 'bg-red-950/20 text-red-500 border border-red-900/40' : 'bg-white/5 text-gray-500'
            }`}>
              {status.message}
            </div>
          )}
        </section>

        <section className="w-full lg:w-[420px] flex flex-col gap-8">
          <div className="bg-[#0a0a0a] rounded-3xl border border-white/5 flex flex-col h-full overflow-hidden shadow-2xl shadow-black">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0c0c0c]">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-lg shadow-red-500/50"></div>
                Aerial Feed
              </span>
              {result && (
                <a href={result.videoUrl} download="cinema_aerial_reveal.mp4" className="text-[9px] font-black text-white hover:text-gray-300 transition-colors uppercase tracking-widest border-b border-white/10">
                  Export Master
                </a>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-black min-h-[560px] relative">
              {result ? (
                <video src={result.videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <div className="text-center px-12">
                  <div className="w-20 h-20 border border-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 bg-white/[0.02] shadow-inner">
                    <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">Standby for signal</p>
                </div>
              )}

              {(status.step === 'analyzing' || status.step === 'generating' || status.step === 'polling') && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center">
                  <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                    <div className="absolute inset-0 border border-white/5 rounded-full"></div>
                    <div className="absolute inset-0 border border-white/40 border-t-transparent rounded-full animate-spin"></div>
                    <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-white">Aerial Stabilization</h3>
                  <p className="text-gray-600 text-[11px] font-medium leading-relaxed italic uppercase tracking-widest max-w-[240px]">"{status.message}"</p>
                </div>
              )}
            </div>

            {result && (
              <div className="p-6 bg-[#080808] border-t border-white/5">
                <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] mb-3 block">Directorial Narrative</span>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium italic">
                  "{result.directorPrompt}"
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="w-full max-w-5xl mt-24 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between text-[9px] text-gray-700 font-black uppercase tracking-[0.4em] gap-6 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          Signal Integrity Verified
        </div>
        <div>Cinematic Pipeline v5.0.0</div>
        <div>© 2024 Luxury Aerial Cinema</div>
      </footer>
    </div>
  );
};

export default App;
