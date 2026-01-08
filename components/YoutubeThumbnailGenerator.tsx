
import React, { useState, useRef } from 'react';
import { Youtube, Loader2, RefreshCw, Upload, ImagePlus, X, Download, Edit3, Send } from 'lucide-react';
import { generateYoutubeThumbnail, modifyYoutubeThumbnail, ensureApiKeySelected } from '../services/geminiService';

interface YoutubeThumbnailGeneratorProps {
  onReset: () => void;
}

const YoutubeThumbnailGenerator: React.FC<YoutubeThumbnailGeneratorProps> = ({ onReset }) => {
  const [videoTitle, setVideoTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const [performerImage, setPerformerImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State to track modification requests for each image index
  const [modifyingIndex, setModifyingIndex] = useState<number | null>(null);
  const [modificationPrompts, setModificationPrompts] = useState<Record<number, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPerformerImage(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!videoTitle.trim()) {
      alert("動画のタイトルを入力してください");
      return;
    }
    
    try {
        const hasKey = await ensureApiKeySelected();
        if (!hasKey) {
            alert("画像生成にはAPIキーが必要です");
            return;
        }
        
        setIsProcessing(true);
        setGeneratedImages([]); // clear previous
        setModificationPrompts({}); // clear prompts

        // Generate 3 variations
        const images = await generateYoutubeThumbnail(
          videoTitle, 
          'Top', // titlePos
          '', // subtitle
          '', // header
          'Medium', // headerSize
          '', // footer
          'Medium', // footerSize
          performerImage,
          undefined, // performerName
          undefined, // performerNameEn
          'Rule of thirds', // composition
          'Vivid High Contrast' // colorScheme
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

          const newImage = await modifyYoutubeThumbnail(currentImage, instruction);
          
          // Update the specific image in the array
          setGeneratedImages(prev => {
              const next = [...prev];
              next[index] = newImage;
              return next;
          });
          
          // Clear prompt after success? Or keep it? Let's clear it to indicate done.
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
    link.download = `youtube_thumbnail_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Youtube className="w-8 h-8 text-red-600 mr-3" />
          Youtubeサムネイルを作る
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        動画タイトル (必須)
                    </label>
                    <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-slate-900"
                        placeholder="例: 【驚愕】正しい歯磨きとは！？"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        文字起こし / 内容メモ (任意)
                    </label>
                    <textarea
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 h-32 resize-none bg-white text-slate-900"
                        placeholder="動画の内容を入力すると、より内容に合ったサムネイルになります..."
                    />
                </div>
            </div>
            
            <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">
                    演者の写真 (任意)
                 </label>
                 <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center h-[260px]">
                    {!performerImage ? (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <ImagePlus className="w-12 h-12 mb-2" />
                            <span className="font-bold">写真をアップロード</span>
                            <span className="text-xs mt-1">※右下に配置されます</span>
                        </button>
                    ) : (
                        <div className="relative w-full h-full">
                            <img 
                                src={`data:image/png;base64,${performerImage}`} 
                                className="w-full h-full object-contain rounded-lg" 
                                alt="Performer" 
                            />
                            <button 
                                onClick={() => setPerformerImage(null)}
                                className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-slate-600 hover:text-red-500"
                            >
                                <X className="w-5 h-5" />
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
        </div>

        <div className="mt-8 flex justify-end">
             <button
                onClick={handleGenerate}
                disabled={isProcessing}
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        生成中...
                    </>
                ) : (
                    'サムネイルを生成 (3案)'
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
                        className="flex items-center text-slate-600 hover:text-red-600 bg-slate-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
                                     className="text-red-600 hover:text-red-700 text-xs flex items-center font-bold"
                                  >
                                      <Download className="w-4 h-4 mr-1" />
                                      保存
                              </button>
                          </p>
                          
                          <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden shadow-sm border border-slate-200 mb-4">
                              <img 
                                src={`data:image/png;base64,${img}`} 
                                className="w-full h-full object-cover" 
                                alt={`Thumbnail ${idx+1}`} 
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
                                      placeholder="修正指示 (例: 文字を赤にして、演者を大きくして)"
                                      className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 bg-white min-h-[50px] resize-none"
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

export default YoutubeThumbnailGenerator;
