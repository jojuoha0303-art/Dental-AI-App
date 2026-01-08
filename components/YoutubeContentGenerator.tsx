
import React, { useState, useRef } from 'react';
import { Youtube, Loader2, RefreshCw, ImagePlus, X, Download, Edit3, Check, Clipboard } from 'lucide-react';
import { generateYoutubeChapter, generateYoutubeThumbnail, modifyYoutubeThumbnail, ensureApiKeySelected } from '../services/geminiService';
import { ThumbnailTextPosition, ThumbnailComposition, ThumbnailColorScheme, ThumbnailFontSize } from '../types';

interface YoutubeContentGeneratorProps {
  onReset: () => void;
}

const YoutubeContentGenerator: React.FC<YoutubeContentGeneratorProps> = ({ onReset }) => {
  // Inputs
  const [videoTitle, setVideoTitle] = useState('');
  const [titlePos, setTitlePos] = useState<ThumbnailTextPosition>('Top');
  
  const [subtitle, setSubtitle] = useState('');
  // Subtitle position is always "Below Title" now

  // New Header / Footer
  const [header, setHeader] = useState('');
  const [headerSize, setHeaderSize] = useState<ThumbnailFontSize>('Medium');
  const [footer, setFooter] = useState('');
  const [footerSize, setFooterSize] = useState<ThumbnailFontSize>('Medium');

  const [transcription, setTranscription] = useState('');
  const [performerImage, setPerformerImage] = useState<string | null>(null);
  const [performerName, setPerformerName] = useState('');
  const [performerNameEn, setPerformerNameEn] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Design Config
  const [composition, setComposition] = useState<ThumbnailComposition>('Rule of thirds');
  const [colorScheme, setColorScheme] = useState<ThumbnailColorScheme>('Vivid High Contrast');

  // Chapter Generation State
  const [generatedChapters, setGeneratedChapters] = useState<string | null>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Thumbnail Generation State
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [modifyingIndex, setModifyingIndex] = useState<number | null>(null);
  const [modificationPrompts, setModificationPrompts] = useState<Record<number, string>>({});

  // Handlers
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

  const handleGenerateChapters = async () => {
    if (!transcription.trim()) {
      alert("文字起こしテキストを入力してください");
      return;
    }
    setIsProcessingText(true);
    try {
      const result = await generateYoutubeChapter(transcription);
      setGeneratedChapters(result);
    } catch (error) {
      alert("テキスト生成に失敗しました");
    } finally {
      setIsProcessingText(false);
    }
  };

  const handleGenerateThumbnails = async () => {
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
        
        setIsProcessingImages(true);
        setGeneratedThumbnails([]); 
        setModificationPrompts({}); 

        // Generate 3 variations with names
        const images = await generateYoutubeThumbnail(
            videoTitle, 
            titlePos,
            subtitle,
            header,
            headerSize,
            footer,
            footerSize,
            performerImage, 
            performerName, 
            performerNameEn,
            composition,
            colorScheme
        );
        
        if (images.length === 0) {
            alert("画像の生成に失敗しました");
        } else {
            setGeneratedThumbnails(images);
        }
    } catch (e) {
        console.error(e);
        alert("画像生成エラーが発生しました");
    } finally {
        setIsProcessingImages(false);
    }
  };

  const handleModifyThumbnail = async (index: number) => {
    const instruction = modificationPrompts[index];
    if (!instruction?.trim()) return;

    const currentImage = generatedThumbnails[index];
    setModifyingIndex(index);
    
    try {
        const hasKey = await ensureApiKeySelected();
        if (!hasKey) {
           alert("APIキーが必要です"); 
           return;
        }

        const newImage = await modifyYoutubeThumbnail(currentImage, instruction);
        
        setGeneratedThumbnails(prev => {
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

  const copyTextToClipboard = () => {
    if (generatedChapters) {
      navigator.clipboard.writeText(generatedChapters);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
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
          YouTubeコンテンツ作成
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            ヘッダー (任意・最上部)
                        </label>
                        <input
                            type="text"
                            value={header}
                            onChange={(e) => setHeader(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-slate-900"
                            placeholder="例: 歯科衛生士勉強会"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-bold text-slate-700 mb-2">サイズ</label>
                        <select 
                            value={headerSize}
                            onChange={(e) => setHeaderSize(e.target.value as ThumbnailFontSize)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
                        >
                            <option value="Large">大</option>
                            <option value="Medium">中</option>
                            <option value="Small">小</option>
                        </select>
                    </div>
                </div>

                {/* Title */}
                <div className="flex gap-4">
                    <div className="flex-1">
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
                    <div className="w-1/3">
                        <label className="block text-sm font-bold text-slate-700 mb-2">配置</label>
                        <select 
                            value={titlePos}
                            onChange={(e) => setTitlePos(e.target.value as ThumbnailTextPosition)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
                        >
                            <option value="Top">上部</option>
                            <option value="Middle">中部</option>
                            <option value="Bottom">下部</option>
                        </select>
                    </div>
                </div>

                {/* Subtitle */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        サブタイトル (任意・タイトルの下)
                    </label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-slate-900"
                        placeholder="例: 歯科医師が教える真実"
                    />
                </div>

                {/* Footer */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            フッター (任意・最下部)
                        </label>
                        <input
                            type="text"
                            value={footer}
                            onChange={(e) => setFooter(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white text-slate-900"
                            placeholder="例: 2025年1月1日 18:00-20:00"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-sm font-bold text-slate-700 mb-2">サイズ</label>
                        <select 
                            value={footerSize}
                            onChange={(e) => setFooterSize(e.target.value as ThumbnailFontSize)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
                        >
                            <option value="Large">大</option>
                            <option value="Medium">中</option>
                            <option value="Small">小</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        文字起こし / 内容メモ (要約作成用)
                    </label>
                    <textarea
                        value={transcription}
                        onChange={(e) => setTranscription(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 h-24 resize-none bg-white text-slate-900"
                        placeholder="動画の文字起こしテキストを入力してください...&#13;※サムネイル画像には反映されません"
                    />
                </div>
            </div>
            
            <div className="space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        演者の写真 (任意)
                    </label>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
                        {!performerImage ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <ImagePlus className="w-12 h-12 mb-2" />
                                <span className="font-bold">写真をアップロード</span>
                                <span className="text-xs mt-1">※サムネイル生成時に使用</span>
                            </button>
                        ) : (
                            <div className="relative w-full h-[200px]">
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

                    <div className="mt-4 grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">名前 (日本語)</label>
                            <input 
                                type="text" 
                                value={performerName}
                                onChange={(e) => setPerformerName(e.target.value)}
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 bg-white text-slate-900"
                                placeholder="例: 山田 太郎"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">名前 (英語表記)</label>
                            <input 
                                type="text" 
                                value={performerNameEn}
                                onChange={(e) => setPerformerNameEn(e.target.value)}
                                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 bg-white text-slate-900"
                                placeholder="例: Taro Yamada"
                            />
                        </div>
                    </div>
                 </div>

                 {/* Design Settings */}
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <h4 className="font-bold text-slate-700 mb-3 text-sm">デザイン設定</h4>
                     <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">構図</label>
                            <select value={composition} onChange={(e) => setComposition(e.target.value as ThumbnailComposition)} className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900">
                                <option value="Rule of thirds">三分割法 (バランス重視)</option>
                                <option value="Negative space">余白重視 (文字見やすい)</option>
                                <option value="Center">日の丸構図 (インパクト)</option>
                                <option value="Symmetrical">左右対称</option>
                                <option value="Diagonal">対角線構図 (動き)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">配色</label>
                            <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value as ThumbnailColorScheme)} className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900">
                                <option value="Vivid High Contrast">高コントラスト (YouTube最適)</option>
                                <option value="Blue and White">青と白 (歯科・清潔感)</option>
                                <option value="Gold and White">ゴールド (高級感・審美)</option>
                                <option value="Pastel">パステル (小児・優しい)</option>
                                <option value="Green and Natural">緑 (安心感)</option>
                                <option value="Monochrome">モノクロ (シック)</option>
                            </select>
                        </div>
                     </div>
                 </div>
            </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 mt-4 gap-4">
             <button
              onClick={handleGenerateChapters}
              disabled={isProcessingText || !transcription.trim()}
              className="px-6 py-3 bg-white border border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isProcessingText ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : '要約のみ生成'}
            </button>
            <button
              onClick={handleGenerateThumbnails}
              disabled={isProcessingImages}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isProcessingImages ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  画像生成中...
                </>
              ) : (
                'サムネイル生成 (3案)'
              )}
            </button>
        </div>
      </div>

      {/* Step 2: Generated Text Results */}
      {generatedChapters && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-red-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center">
              生成結果：要約・チャプター・ハッシュタグ
            </h3>
            <div className="flex gap-2">
               <button onClick={handleGenerateChapters} disabled={isProcessingText} className="flex items-center text-white/90 hover:text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3 h-3 mr-1 ${isProcessingText ? 'animate-spin' : ''}`} />
                  再生成
               </button>
            </div>
          </div>
          <div className="p-6">
            <textarea 
              value={generatedChapters}
              onChange={(e) => setGeneratedChapters(e.target.value)}
              className="w-full h-80 p-4 bg-slate-50 rounded-xl whitespace-pre-wrap font-sans text-slate-800 border border-slate-200 leading-relaxed resize-y focus:ring-2 focus:ring-red-600 focus:bg-white transition-colors"
            />
            <div className="mt-6 flex justify-end items-center">
                  <button
                    onClick={copyTextToClipboard}
                    className={`flex items-center px-4 py-2 rounded-lg font-bold transition-all text-sm border ${
                      copiedText 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {copiedText ? <Check className="w-4 h-4 mr-2" /> : <Clipboard className="w-4 h-4 mr-2" />}
                    {copiedText ? 'コピー完了' : 'テキストをコピー'}
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generated Thumbnails */}
      {generatedThumbnails.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">生成されたサムネイル</h3>
                    <p className="text-xs text-slate-500 mt-1">デザインを抜本的に変える場合は全件再生成を押してください。</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={handleGenerateThumbnails} 
                        disabled={isProcessingImages || modifyingIndex !== null} 
                        className="flex items-center text-slate-600 hover:text-red-600 bg-slate-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isProcessingImages ? 'animate-spin' : ''}`} />
                        全件再生成
                    </button>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 gap-12">
                  {generatedThumbnails.map((img, idx) => (
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
                                  onClick={() => handleModifyThumbnail(idx)}
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

       <div className="mt-8 text-center">
            <button 
                onClick={onReset} 
                className="text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-6 py-2 rounded-lg transition-colors"
            >
                ホームに戻る
            </button>
       </div>
    </div>
  );
};

export default YoutubeContentGenerator;