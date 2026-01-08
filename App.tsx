
import React, { useState } from 'react';
import { GenerationMode } from './types';
import StaffBlogGenerator from './components/StaffBlogGenerator';
import { Layers, Coffee } from 'lucide-react';

const App: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode | null>(null);

  const handleModeSelect = (mode: GenerationMode) => {
    setGenerationMode(mode);
  };

  const handleReset = () => {
    setErrorMsg(null);
    setGenerationMode(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-600 cursor-pointer" onClick={handleReset}>
            <Layers className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">歯科医院経営サポートアプリ</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center pt-8 pb-20 px-4">
        {errorMsg && (
            <div className="w-full max-w-2xl mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
                <p>{errorMsg}</p>
            </div>
        )}

        {!generationMode ? (
           <div className="w-full max-w-5xl text-center mt-10">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-16">
                 メニュー
              </h1>
              
              <div className="flex justify-center">
                 <button 
                   onClick={() => handleModeSelect('STAFF_BLOG')}
                   className="flex flex-col items-center p-12 bg-white border-2 border-slate-200 rounded-3xl hover:border-orange-500 hover:shadow-xl transition-all group w-full max-w-md"
                 >
                    <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors">
                       <Coffee className="w-12 h-12 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">スタッフブログを作成</h3>
                    <p className="text-slate-500 text-base text-center leading-relaxed">
                       日常の出来事や写真から、<br/>
                       親しみやすいブログ記事を作成
                    </p>
                 </button>
              </div>
           </div>
        ) : (
          <div className="w-full">
            {generationMode === 'STAFF_BLOG' && (
               <StaffBlogGenerator onReset={handleReset} />
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 SlideGen Pro (Powered by Gemini 3 Pro)</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
