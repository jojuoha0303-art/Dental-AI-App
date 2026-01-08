
import React, { useState, useRef } from 'react';
import { ImagePlus, MessageCircle, Clipboard, Check, RefreshCw, Loader2, X, FileAudio, FileText, Zap, Download, PenTool, Coffee, Activity } from 'lucide-react';
import { InputFile } from '../types';
import { generateLineInfographic, ensureApiKeySelected } from '../services/geminiService';

interface LineGeneratorProps {
  mode: 'LINE' | 'MEDICAL_RECORD' | 'STAFF_BLOG';
  onGenerate: (data: any) => Promise<string>;
  onReset: () => void;
}

const LineGenerator: React.FC<LineGeneratorProps> = ({ mode, onGenerate, onReset }) => {
  const [age, setAge] = useState<string>('');
  const [visitStatus, setVisitStatus] = useState<'first' | 'maintenance' | 'long_time'>('first');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState<InputFile[]>([]);
  const [audioFiles, setAudioFiles] = useState<InputFile[]>([]);
  
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [infographicImage, setInfographicImage] = useState<string | null>(null);
  const [imageInstruction, setImageInstruction] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const isStaffBlog = mode === 'STAFF_BLOG';
  const isMedicalRecord = mode === 'MEDICAL_RECORD';
  const isLine = mode === 'LINE';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: InputFile[] = [];
      const fileList = e.target.files;
      Array.from(fileList).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const target = event.target as FileReader;
          const result = target.result as string;
          if (!result) return;
          
          const base64 = result.split(',')[1];
          newFiles.push({ mimeType: file.type, data: base64 });
          if (newFiles.length === fileList.length) {
            // For Staff Blog allow more images, for LINE limit to 2
            setImages(prev => {
                const combined = [...prev, ...newFiles];
                return isStaffBlog ? combined : combined.slice(0, 2);
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAdditionalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      files.forEach((file: File) => {
        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
            const text = event.target?.result as string;
            setAdditionalInfo(prev => prev + (prev ? '\n' : '') + `【ファイル: ${file.name}】\n` + text);
            };
            reader.readAsText(file);
        } else {
            // Audio file
            const reader = new FileReader();
            reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                const base64 = result.split(',')[1];
                setAudioFiles(prev => [...prev, { mimeType: file.type, data: base64 }]);
            }
            };
            reader.readAsDataURL(file);
        }
      });
      
      // Reset value to allow re-uploading same files if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeAudio = (index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateInfographic = async (message: string, instruction?: string) => {
    try {
      const hasKey = await ensureApiKeySelected();
      if (!hasKey) {
        alert("画像生成にはAPIキーの選択が必要です。");
        return;
      }
      setIsGeneratingImage(true);
      const imgData = await generateLineInfographic(message, instruction);
      setInfographicImage(imgData);
    } catch (e) {
      console.error(e);
      // alert("インフォグラフィックの生成に失敗しました");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!isStaffBlog && !isMedicalRecord && !age) {
        alert("年齢を入力してください");
        return;
    }
    
    // For Staff Blog, images are optional but content is needed.
    if (isStaffBlog && !additionalInfo && images.length === 0) {
        alert("ブログの内容または写真をアップロードしてください");
        return;
    }
    
    // For Medical Record, text/audio is the main input
    if (isMedicalRecord && !additionalInfo && audioFiles.length === 0) {
        alert("会話のテキストまたは音声データを入力してください");
        return;
    }
    
    // For LINE, images are mandatory
    if (isLine && images.length === 0) {
        alert("検査結果の画像を少なくとも1枚アップロードしてください");
        return;
    }

    setIsProcessing(true);
    setGeneratedMessage(null); // Clear previous
    setInfographicImage(null);
    setImageInstruction('');

    try {
      const result = await onGenerate({
        age,
        visitStatus,
        additionalInfo,
        images,
        audioFiles
      });
      setGeneratedMessage(result);
      
      // Auto-start infographic generation only for LINE
      if (mode === 'LINE') {
        generateInfographic(result);
      }
      
    } catch (error) {
      alert("生成に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = () => {
     handleSubmit();
  };

  const handleUpdateImage = () => {
    if (generatedMessage) {
        generateInfographic(generatedMessage, imageInstruction);
    }
  };

  const copyToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadInfographic = () => {
    if (!infographicImage) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${infographicImage}`;
    link.download = `line-summary-result.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {!generatedMessage ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            {mode === 'LINE' && (
              <>
                <MessageCircle className="w-8 h-8 text-green-500 mr-3" />
                患者さんへのLINE作成
              </>
            )}
            {mode === 'MEDICAL_RECORD' && (
              <>
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                診療録（カルテ）の作成
              </>
            )}
            {mode === 'STAFF_BLOG' && (
              <>
                <Coffee className="w-8 h-8 text-orange-500 mr-3" />
                スタッフブログを作成
              </>
            )}
          </h2>
          
          <div className="space-y-6">
            {/* Images - Hidden for Medical Record */}
            {!isMedicalRecord && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {isStaffBlog ? '1. ブログに載せる写真 (任意)' : 
                   '1. 検査結果の画像 (必須・最大2枚)'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img 
                        src={`data:${img.mimeType};base64,${img.data}`} 
                        className="w-full h-full object-cover" 
                        alt="upload" 
                      />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-slate-600 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(isStaffBlog || images.length < 2) && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-green-400 transition-colors"
                    >
                      <ImagePlus className="w-8 h-8 mb-2" />
                      <span>画像を追加</span>
                    </button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleImageUpload}
                />
                {isLine && images.length === 0 && (
                    <p className="text-xs text-red-500 mt-2 font-bold">
                        ※ DMFTやBOPなどのリスク評価を行うため、検査結果の画像を必ずアップロードしてください。
                    </p>
                )}
              </div>
            )}

            {!isStaffBlog && !isMedicalRecord && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Age */}
                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        2. 患者様の年齢 (必須)
                    </label>
                    <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                        placeholder="例: 30"
                    />
                    </div>

                    {/* Visit Status */}
                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        3. 来院状況 (必須)
                    </label>
                    <select
                        value={visitStatus}
                        onChange={(e) => setVisitStatus(e.target.value as any)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900"
                    >
                        <option value="first">初診</option>
                        <option value="maintenance">メインテナンス</option>
                        <option value="long_time">久しぶりの来院</option>
                    </select>
                    </div>
                </div>
            )}

            {/* Additional Info / Transcription */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {isStaffBlog ? '2. ブログのテーマ・内容メモ' : 
                 isMedicalRecord ? '1. 会話の録音データまたは文字起こしテキスト' :
                 '4. 補足情報・伝えたいこと (テキスト/音声)'}
              </label>
              <div className="relative">
                 <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 h-40 resize-none bg-white text-slate-900"
                    placeholder={
                        isStaffBlog ? "例: 今日はスタッフみんなでランチに行きました！〇〇が美味しかったです。..." : 
                        isMedicalRecord ? "（ここに文字起こしテキストを入力してください）\n例: （患者）右奥歯が痛いんです...（医師）いつからですか？..." :
                        "例: 説明時の音声文字起こし、現場での様子、特に伝えたいポイントなど..."
                    }
                 />
                 <button 
                   onClick={() => additionalFileInputRef.current?.click()}
                   className="absolute bottom-3 right-3 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                   title="ファイル(音声/テキスト)を追加"
                 >
                    <FileAudio className="w-5 h-5" />
                 </button>
                 <input 
                    type="file" 
                    ref={additionalFileInputRef} 
                    className="hidden" 
                    multiple
                    accept=".txt,.mp3,.wav,.m4a"
                    onChange={handleAdditionalFileUpload} 
                 />
              </div>

              {/* Audio Files List */}
              {audioFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                   {audioFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
                         <FileAudio className="w-4 h-4 mr-1.5" />
                         <span>音声データ {idx + 1}</span>
                         <button onClick={() => removeAudio(idx)} className="ml-2 text-green-500 hover:text-red-500">
                            <X className="w-3 h-3" />
                         </button>
                      </div>
                   ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === 'LINE' 
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200' 
                    : mode === 'MEDICAL_RECORD'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  <>
                    {mode === 'LINE' && <MessageCircle className="w-5 h-5 mr-2" />}
                    {mode === 'MEDICAL_RECORD' && <FileText className="w-5 h-5 mr-2" />}
                    {mode === 'STAFF_BLOG' && <Coffee className="w-5 h-5 mr-2" />}
                    
                    {mode === 'LINE' ? 'LINEメッセージを作成' : 
                     mode === 'MEDICAL_RECORD' ? '診療録を作成' : 'ブログ記事を作成'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className={`${
                    mode === 'LINE' ? 'bg-green-500' : 
                    mode === 'MEDICAL_RECORD' ? 'bg-blue-600' : 'bg-orange-500'
                } p-4 text-white flex justify-between items-center`}>
                    <h3 className="font-bold text-lg flex items-center">
                        {mode === 'LINE' && <MessageCircle className="w-5 h-5 mr-2" />}
                        {mode === 'MEDICAL_RECORD' && <FileText className="w-5 h-5 mr-2" />}
                        {mode === 'STAFF_BLOG' && <Coffee className="w-5 h-5 mr-2" />}
                        
                        {mode === 'LINE' ? '生成されたメッセージ' : 
                         mode === 'MEDICAL_RECORD' ? '生成された診療録' : '生成されたブログ'}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={handleRegenerate} disabled={isProcessing} className="flex items-center text-white/90 hover:text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-3 h-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
                            再生成
                        </button>
                        <button onClick={onReset} className="text-white/90 hover:text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">
                            最初から
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <textarea 
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                        className={`w-full h-96 p-6 bg-slate-50 rounded-xl whitespace-pre-wrap font-sans text-slate-800 border border-slate-200 leading-relaxed resize-y focus:ring-2 focus:bg-white transition-colors ${
                            mode === 'LINE' ? 'focus:ring-green-500' : 
                            mode === 'MEDICAL_RECORD' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'
                        }`}
                    />
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={copyToClipboard}
                            className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all ${
                                copied 
                                ? 'bg-slate-800 text-white' 
                                : `${
                                    mode === 'LINE' ? 'bg-green-500 hover:bg-green-600' : 
                                    mode === 'MEDICAL_RECORD' ? 'bg-blue-600 hover:bg-blue-700' : 
                                    'bg-orange-500 hover:bg-orange-600'
                                  } text-white shadow-md`
                            }`}
                        >
                            {copied ? <Check className="w-5 h-5 mr-2" /> : <Clipboard className="w-5 h-5 mr-2" />}
                            {copied ? 'コピーしました' : 'テキストをコピー'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Infographic Section - Only for LINE mode */}
            {mode === 'LINE' && (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                     <div className="bg-indigo-600 p-4 text-white">
                        <h3 className="font-bold text-lg flex items-center">
                            <ImagePlus className="w-5 h-5 mr-2" />
                            検査結果の図解まとめ
                        </h3>
                     </div>
                     <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                        {isGeneratingImage ? (
                            <div className="flex flex-col items-center text-slate-500">
                                 <div className="w-12 h-12 mb-4 relative">
                                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                 </div>
                                 <p className="font-medium animate-pulse">インフォグラフィックを作成中...</p>
                            </div>
                        ) : infographicImage ? (
                            <div className="flex flex-col items-center w-full">
                                <img 
                                    src={`data:image/png;base64,${infographicImage}`} 
                                    alt="Summary Infographic" 
                                    className="max-w-full max-h-[500px] rounded-lg shadow-md border border-slate-200 mb-6"
                                />
                                
                                {/* Actions below image */}
                                <div className="w-full max-w-lg mb-6 flex gap-3">
                                    <button
                                        onClick={downloadInfographic}
                                        className="flex-1 flex items-center justify-center px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        画像を保存
                                    </button>
                                </div>
    
                                {/* Modification Section */}
                                <div className="w-full max-w-lg bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                                        <PenTool className="w-4 h-4 mr-2 text-indigo-500" />
                                        画像の修正指示
                                    </label>
                                    <div className="flex gap-2">
                                        <textarea
                                            value={imageInstruction}
                                            onChange={(e) => setImageInstruction(e.target.value)}
                                            className="flex-1 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                                            placeholder="例: 背景をもっとピンクにして、文字を大きくして"
                                            rows={2}
                                        />
                                        <button 
                                            onClick={handleUpdateImage}
                                            disabled={!imageInstruction.trim()}
                                            className="px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center min-w-[80px]"
                                        >
                                            <RefreshCw className="w-4 h-4 mb-1" />
                                            再生成
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-slate-400 mb-4">画像の生成に失敗したか、まだ開始されていません</p>
                                <button 
                                    onClick={() => generatedMessage && generateInfographic(generatedMessage)}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 font-medium"
                                >
                                    画像生成を再試行
                                </button>
                            </div>
                        )}
                     </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default LineGenerator;
