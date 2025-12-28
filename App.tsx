
import React, { useState, useCallback, useRef } from 'react';
import { generateDirectorPrompt, generateVeoVideo } from './services/geminiService';
import { VideoGenerationStatus, GenerationResult } from './types';

// Fix for AI Studio global types: define the AIStudio interface and augment Window with identical modifiers.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    readonly aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [status, setStatus] = useState<VideoGenerationStatus>({ step: 'idle', message: '' });
  const [result, setResult] = useState<GenerationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
      return true;
    } catch (err) {
      console.error("Error checking/selecting API key", err);
      return false;
    }
  };

  const startGeneration = async () => {
    if (!selectedImage) return;

    const hasKey = await ensureApiKey();
    if (!hasKey) return;

    try {
      setStatus({ step: 'analyzing', message: 'Director analyzing reference images...' });
      
      const directorPrompt = await generateDirectorPrompt(selectedImage.data, selectedImage.mimeType);
      
      setStatus({ step: 'generating', message: 'Starting drone flight sequence...' });
      
      const videoUrl = await generateVeoVideo(
        directorPrompt, 
        selectedImage.data, 
        selectedImage.mimeType, 
        (msg) => setStatus(prev => ({ ...prev, message: msg }))
      );

      setResult({ videoUrl, directorPrompt });
      setStatus({ step: 'completed', message: 'Production complete.' });
    } catch (error: any) {
      console.error(error);
      if (error.message === "API_KEY_EXPIRED") {
        await window.aistudio.openSelectKey();
        setStatus({ step: 'error', message: 'Please re-select your paid API key and try again.' });
      } else {
        setStatus({ step: 'error', message: 'Production interrupted. Check console for details.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#050505] text-white p-4 sm:p-8">
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AERIAL DIRECTOR AI
          </h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-medium">
            Professional Drone Cinematography Engine
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white transition-colors border-b border-gray-800"
          >
            Billing Requirements
          </a>
          <button 
            onClick={() => window.aistudio.openSelectKey()}
            className="px-4 py-2 text-xs bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all uppercase tracking-tighter"
          >
            Select API Key
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8">
        {/* Input Section */}
        <section className="flex-1 space-y-8">
          <div 
            className={`relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
              selectedImage ? 'border-gray-800' : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            {selectedImage ? (
              <>
                <img 
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                  className="w-full h-full object-cover" 
                  alt="Reference" 
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full hover:bg-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <div className="bg-gray-900 p-4 rounded-full group-hover:scale-110 transition-transform mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span className="text-gray-400 font-medium">Upload Reference Photo</span>
                <span className="text-gray-600 text-xs mt-2 italic">Ground truth for drone sequence</span>
              </label>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cinematography Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
                <span className="text-xs text-gray-500 block mb-1">Format</span>
                <span className="font-medium">9:16 Vertical</span>
              </div>
              <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
                <span className="text-xs text-gray-500 block mb-1">Lens</span>
                <span className="font-medium">24mm Aerial</span>
              </div>
              <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
                <span className="text-xs text-gray-500 block mb-1">Duration</span>
                <span className="font-medium">6-8 Seconds</span>
              </div>
              <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
                <span className="text-xs text-gray-500 block mb-1">Movement</span>
                <span className="font-medium">Cinematic Orbit</span>
              </div>
            </div>
          </div>

          <button
            onClick={startGeneration}
            disabled={!selectedImage || status.step !== 'idle' && status.step !== 'completed' && status.step !== 'error'}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              !selectedImage 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-gray-200 active:scale-[0.98]'
            }`}
          >
            {status.step === 'analyzing' || status.step === 'generating' || status.step === 'polling' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                Producing...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Generate Drone Footage
              </>
            )}
          </button>

          {status.message && (
            <div className={`p-4 rounded-xl text-center text-sm font-medium animate-pulse transition-all ${
              status.step === 'error' ? 'bg-red-950/30 text-red-400 border border-red-900/50' : 'bg-white/5 text-gray-400'
            }`}>
              {status.message}
            </div>
          )}
        </section>

        {/* Output Section */}
        <section className="w-full lg:w-[400px] flex flex-col gap-6">
          <div className="bg-[#111] rounded-2xl border border-gray-800 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Master Preview</span>
              {result && (
                <a 
                  href={result.videoUrl} 
                  download="drone_footage.mp4"
                  className="text-xs text-white hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Export
                </a>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center bg-black min-h-[500px] relative">
              {result ? (
                <video 
                  src={result.videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center px-8">
                  <div className="w-16 h-16 border-2 border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-gray-700 font-medium">No footage generated</p>
                  <p className="text-gray-800 text-xs mt-2">Upload and click generate to begin the aerial sequence</p>
                </div>
              )}

              {/* Status Overlay for generation */}
              {(status.step === 'analyzing' || status.step === 'generating' || status.step === 'polling') && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">Director's Workroom</h3>
                  <p className="text-gray-400 text-sm">{status.message}</p>
                </div>
              )}
            </div>

            {result && (
              <div className="p-4 bg-white/5 border-t border-gray-800">
                <span className="text-[10px] font-bold text-gray-600 uppercase mb-2 block">Director's Treatment</span>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  "{result.directorPrompt}"
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-5xl mt-16 pt-8 border-t border-gray-900 flex flex-col sm:flex-row justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest gap-4 text-center sm:text-left">
        <div>Proprietary Drone Physics Engine v3.1</div>
        <div>Engineered for Ultra-Realistic Cinema</div>
        <div>© 2024 Aerial Director Global</div>
      </footer>
    </div>
  );
};

export default App;
