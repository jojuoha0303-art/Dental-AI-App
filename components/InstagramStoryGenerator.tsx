
import React, { useState, useRef } from 'react';
import { Instagram, Loader2, RefreshCw, ImagePlus, X, Download } from 'lucide-react';
import { generateInstagramStory, ensureApiKeySelected } from '../services/geminiService';
import { InstagramStoryStyle } from '../types';

interface InstagramStoryGeneratorProps {
  onReset: () => void;
}

const InstagramStoryGenerator: React.FC<InstagramStoryGeneratorProps> = ({ onReset }) => {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<InstagramStoryStyle>('Visibility');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!message.trim()) {
      alert("描きたいメッセージは必須です");
      return;
    }
    if (!image) {
      alert("画像のアップロードは必須です");
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

      const results = await generateInstagramStory(image, style, message, note);
      
      if (results.length === 0) {
        alert("画像の生成に失敗しました");
      } else {
        setGeneratedImages(results);
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (base64: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `story_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Instagram className="w-8 h-8 text-pink-600 mr-3" />
          Instagramストーリーズを作成
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                画像 (必須)
              </label>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
                {!image ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center text-slate-400 hover:text-pink-600 transition-colors"
                  >
                    <ImagePlus className="w-12 h-12 mb-2" />
                    <span className="font-bold">画像をアップロード</span>
                  </button>
                ) : (
                  <div className="relative w-full h-[200px]">
                    <img 
                      src={`data:image/png;base64,${image}`} 
                      className="w-full h-full object-contain rounded-lg" 
                      alt="Upload" 
                    />
                    <button 
                      onClick={() => setImage(null)}
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

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                雰囲気
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStyle('Visibility')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    style === 'Visibility'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-200'
                      : 'border-slate-200 bg-white hover:border-pink-300'
                  }`}
                >
                  <div className="font-bold text-sm">可視性重視</div>
                  <div className="text-xs text-slate-500 mt-1">白背景・黒太文字</div>
                </button>
                <button
                  onClick={() => setStyle('Emphasis')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    style === 'Emphasis'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-200'
                      : 'border-slate-200 bg-white hover:border-pink-300'
                  }`}
                >
                  <div className="font-bold text-sm">強調性重視</div>
                  <div className="text-xs text-slate-500 mt-1">グレー背景・赤太文字</div>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Message */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                描きたいメッセージ (必須)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white text-slate-900 h-24 resize-none"
                placeholder="例: 離乳食教室開催！"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                雰囲気の注釈 (任意)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white text-slate-900 h-24 resize-none"
                placeholder="例: 文字をキラキラさせて、人物を小さめに配置..."
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'ストーリーズを生成 (3案)'}
          </button>
        </div>
      </div>

      {/* Results */}
      {generatedImages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">生成結果</h3>
            <button 
              onClick={handleGenerate} 
              disabled={isProcessing} 
              className="flex items-center text-slate-600 hover:text-pink-600 bg-slate-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              全件再生成
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {generatedImages.map((img, idx) => (
              <div key={idx} className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="relative aspect-[9/16] bg-slate-200 rounded-lg overflow-hidden mb-3">
                  <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" alt={`Story ${idx+1}`} />
                </div>
                <button 
                  onClick={() => downloadImage(img, idx)}
                  className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" /> 保存
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramStoryGenerator;
