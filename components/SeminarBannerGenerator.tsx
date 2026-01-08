
import React, { useState, useRef } from 'react';
import { Ticket, Loader2, RefreshCw, ImagePlus, X, Download, Edit3, Monitor, Square } from 'lucide-react';
import { generateSeminarBanner, modifySeminarBanner, ensureApiKeySelected } from '../services/geminiService';

interface SeminarBannerGeneratorProps {
  onReset: () => void;
}

const SeminarBannerGenerator: React.FC<SeminarBannerGeneratorProps> = ({ onReset }) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bodyText, setBodyText] = useState(''); // New State
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "1:1">("16:9");

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [modifyingIndex, setModifyingIndex] = useState<number | null>(null);
  const [modificationPrompts, setModificationPrompts] = useState<Record<number, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhoto(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() || !genre.trim() || !date.trim()) {
      alert("必須項目（タイトル、ジャンル、日時）を入力してください");
      return;
    }
    
    try {
        const hasKey = await ensureApiKeySelected();
        if (!hasKey) {
            alert("画像生成にはAPIキーが必要です");
            return;
        }
        
        setIsProcessing(true);
        setGeneratedImages([]); 
        setModificationPrompts({}); 

        const images = await generateSeminarBanner(
          title, 
          genre, 
          date, 
          location, 
          name, 
          nameEn, 
          photo,
          bodyText,
          aspectRatio
        );
        
        if (images.length === 0) {
            alert("画像の生成に失敗しました");
        } else {
            setGeneratedImages(images);
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleModify = async (index: number) => {
      const instruction = modificationPrompts[index];
      if (!instruction?.trim()) return;

      const currentImage = generatedImages[index];
      setModifyingIndex(index);
      
      try {
          const hasKey = await ensureApiKeySelected();
          if (!hasKey) {
             alert("APIキーが必要です"); 
             return;
          }

          const newImage = await modifySeminarBanner(currentImage, instruction, aspectRatio);
          
          setGeneratedImages(prev => {
              const next = [...prev];
              next[index] = newImage;
              return next;
          });
          
          setModificationPrompts(prev => ({...prev, [index]: ''}));
      } catch (e) {
          console.error(e);
          alert("画像の修正に失敗しました");
      } finally {
          setModifyingIndex(null);
      }
  };

  const downloadImage = (base64: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `seminar_banner_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Ticket className="w-8 h-8 text-cyan-600 mr-3" />
          セミナー宣伝を作成
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        セミナータイトル <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                        placeholder="例: 最新インプラント治療の実際"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        ジャンル (インプラント, CRなど) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                        placeholder="例: インプラント"
                    />
                    <p className="text-xs text-slate-400 mt-1">※画像生成の参考にのみ使用されます（文字は入りません）</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        本文 (解説・メッセージ)
                    </label>
                    <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900 resize-none h-24"
                        placeholder="例: 基礎から応用まで、臨床に役立つテクニックを徹底解説します。"
                    />
                    <p className="text-xs text-slate-400 mt-1">※内容は要約され、キャッチコピーとして画像に使用されます</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        開催日時 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                        placeholder="例: 2024年11月24日(日) 10:00~"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        開催場所
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                        placeholder="例: 東京国際フォーラム / オンライン"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        生成画像のサイズ
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAspectRatio("16:9")}
                            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border transition-all ${
                                aspectRatio === "16:9" 
                                    ? "bg-cyan-50 border-cyan-500 text-cyan-700" 
                                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <Monitor className="w-4 h-4 mr-2" />
                            16:9 (横長)
                        </button>
                        <button
                            onClick={() => setAspectRatio("1:1")}
                            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border transition-all ${
                                aspectRatio === "1:1" 
                                    ? "bg-cyan-50 border-cyan-500 text-cyan-700" 
                                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <Square className="w-4 h-4 mr-2" />
                            1:1 (正方形)
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                        演者の写真
                    </label>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px]">
                        {!photo ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center text-slate-400 hover:text-cyan-600 transition-colors"
                            >
                                <ImagePlus className="w-10 h-10 mb-2" />
                                <span className="font-bold text-sm">写真をアップロード</span>
                            </button>
                        ) : (
                            <div className="relative w-full h-[150px]">
                                <img 
                                    src={`data:image/png;base64,${photo}`} 
                                    className="w-full h-full object-contain rounded-lg" 
                                    alt="Speaker" 
                                />
                                <button 
                                    onClick={() => setPhoto(null)}
                                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-slate-600 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <input 
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">名前 (日本語)</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                            placeholder="例: 山田 太郎"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">名前 (英語表記)</label>
                        <input 
                            type="text" 
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white text-slate-900"
                            placeholder="例: Taro Yamada"
                        />
                     </div>
                 </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
             <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="px-8 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        生成中...
                    </>
                ) : (
                    'バナーを生成 (3案)'
                )}
            </button>
        </div>
      </div>

      {/* Results */}
      {generatedImages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">生成結果</h3>
                  <div className="flex gap-2">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isProcessing || modifyingIndex !== null} 
                        className="flex items-center text-slate-600 hover:text-cyan-600 bg-slate-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                        全件再生成
                    </button>
                    <button 
                        onClick={onReset} 
                        className="text-slate-500 hover:text-slate-800 bg-slate-100 px-4 py-2 rounded-lg transition-colors"
                    >
                        最初から
                    </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 gap-12">
                  {generatedImages.map((img, idx) => (
                      <div key={idx} className="flex flex-col bg-slate-50 p-6 rounded-xl border border-slate-200">
                          <p className="text-sm font-bold text-slate-500 mb-3 flex justify-between">
                              <span>案 {idx + 1}</span>
                              <button
                                     onClick={() => downloadImage(img, idx)}
                                     className="text-cyan-600 hover:text-cyan-700 text-xs flex items-center font-bold"
                                  >
                                      <Download className="w-4 h-4 mr-1" />
                                      保存
                              </button>
                          </p>
                          
                          <div className={`relative ${aspectRatio === "1:1" ? "aspect-square max-w-md mx-auto" : "aspect-video"} bg-slate-200 rounded-lg overflow-hidden shadow-sm border border-slate-200 mb-4`}>
                              <img 
                                src={`data:image/png;base64,${img}`} 
                                className="w-full h-full object-cover" 
                                alt={`Banner ${idx+1}`} 
                              />
                              {modifyingIndex === idx && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                                      <p className="absolute mt-16 text-white font-bold text-shadow">修正中...</p>
                                  </div>
                              )}
                          </div>

                          {/* Modification Input */}
                          <div className="flex gap-2 items-start">
                              <div className="flex-1 relative">
                                  <div className="absolute top-3 left-3 text-slate-400">
                                      <Edit3 className="w-4 h-4" />
                                  </div>
                                  <textarea
                                      value={modificationPrompts[idx] || ''}
                                      onChange={(e) => setModificationPrompts(prev => ({...prev, [idx]: e.target.value}))}
                                      placeholder="修正指示 (例: タイトル文字を大きく、背景をもっと青く)"
                                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-600 bg-white min-h-[50px] resize-none"
                                  />
                              </div>
                              <button
                                  onClick={() => handleModify(idx)}
                                  disabled={modifyingIndex !== null || !modificationPrompts[idx]?.trim()}
                                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold flex flex-col items-center justify-center h-[50px] min-w-[80px]"
                              >
                                  <RefreshCw className="w-4 h-4 mb-1" />
                                  修正
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default SeminarBannerGenerator;
