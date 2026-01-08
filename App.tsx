
import React, { useState } from 'react';
import { GenerationMode, LineInput, AnalysisInput } from './types';
import { generateLineMessage, generateMedicalRecord, ensureApiKeySelected } from './services/geminiService';
import LineGenerator from './components/LineGenerator';
import StaffBlogGenerator from './components/StaffBlogGenerator';
import GoogleMapReplyGenerator from './components/GoogleMapReplyGenerator';
import YoutubeContentGenerator from './components/YoutubeContentGenerator';
import HygienistRecordGenerator from './components/HygienistRecordGenerator';
import FlyerGenerator from './components/FlyerGenerator';
import InstagramStoryGenerator from './components/InstagramStoryGenerator';
import MeetingAgendaGenerator from './components/MeetingAgendaGenerator';
import Dashboard from './pages/Dashboard';
import { Layers, Zap, FileText, Share2, MessageCircle, Stethoscope, Coffee, MapPin, Youtube, Image as ImageIcon, ClipboardList, Newspaper, Instagram, Users, Loader2, BarChart3 } from 'lucide-react';

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
                 やりたいことを選んでください
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button 
                   onClick={() => handleModeSelect('DASHBOARD')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-600 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                       <BarChart3 className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">経営分析ダッシュボード</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       CSVデータをアップロードして、<br/>
                       売上やKPIを可視化・分析
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('STAFF_BLOG')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-orange-500 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors">
                       <Coffee className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">スタッフブログを作成</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       日常の出来事や写真から、<br/>
                       親しみやすいブログ記事を作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('LINE')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-green-500 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                       <MessageCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">患者さんへLINEを送る</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       検査結果の画像から、<br/>
                       優しく分かりやすいメッセージを作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('MEDICAL_RECORD')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                       <Stethoscope className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">診療録を作成</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       検査結果と補足情報から、<br/>
                       SOAP形式の診療録案を生成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('HYGIENIST_RECORD')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-teal-600 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                       <ClipboardList className="w-10 h-10 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">衛生士業務記録を作成</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       SOPEN形式で<br/>
                       業務記録を素早く作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('MEETING_AGENDA')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-purple-600 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
                       <Users className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">ミーティング議案を作成</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       スタッフからの意見を集約し、<br/>
                       効果的な会議アジェンダを作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('GOOGLE_MAP_REPLY')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-red-500 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                       <MapPin className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">口コミへの返信を作成</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       患者様からの口コミに対し、<br/>
                       誠実で感謝を伝える返信を作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('YOUTUBE_CONTENT')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-red-600 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
                       <Youtube className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">YouTubeコンテンツ</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       文字起こしから要約・サムネイルを<br/>
                       一括で作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('FLYER')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-indigo-600 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                       <Newspaper className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">チラシ・ポスター作成</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       院内掲示や配布用のチラシデザインを<br/>
                       写真入りで作成
                    </p>
                 </button>

                 <button 
                   onClick={() => handleModeSelect('INSTAGRAM_STORY')}
                   className="flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-2xl hover:border-pink-600 hover:shadow-xl transition-all group"
                 >
                    <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mb-6 group-hover:bg-pink-100 transition-colors">
                       <Instagram className="w-10 h-10 text-pink-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Instagramストーリーズ</h3>
                    <p className="text-slate-500 text-sm text-center leading-relaxed">
                       写真とメッセージから<br/>
                       注目を集めるストーリーズ画像を作成
                    </p>
                 </button>
              </div>
           </div>
        ) : (
          <div className="w-full">
            {generationMode === 'DASHBOARD' && (
               <Dashboard onReset={handleReset} />
            )}

            {generationMode === 'LINE' && (
               <LineGenerator mode="LINE" onGenerate={generateLineMessage} onReset={handleReset} />
            )}

            {generationMode === 'MEDICAL_RECORD' && (
               <LineGenerator mode="MEDICAL_RECORD" onGenerate={generateMedicalRecord} onReset={handleReset} />
            )}

            {generationMode === 'STAFF_BLOG' && (
               <StaffBlogGenerator onReset={handleReset} />
            )}

            {generationMode === 'GOOGLE_MAP_REPLY' && (
               <GoogleMapReplyGenerator onReset={handleReset} />
            )}

            {generationMode === 'YOUTUBE_CONTENT' && (
                <YoutubeContentGenerator onReset={handleReset} />
            )}

            {generationMode === 'HYGIENIST_RECORD' && (
                <HygienistRecordGenerator onReset={handleReset} />
            )}

            {generationMode === 'FLYER' && (
                <FlyerGenerator onReset={handleReset} />
            )}

            {generationMode === 'INSTAGRAM_STORY' && (
                <InstagramStoryGenerator onReset={handleReset} />
            )}

            {generationMode === 'MEETING_AGENDA' && (
                <MeetingAgendaGenerator onReset={handleReset} />
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2026 prime-dentalnet </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
