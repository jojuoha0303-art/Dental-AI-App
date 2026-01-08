
import React, { useState } from 'react';
import { Youtube, Loader2, Check, Clipboard, RefreshCw } from 'lucide-react';
import { generateYoutubeChapter } from '../services/geminiService';

interface YoutubeChapterGeneratorProps {
  onReset: () => void;
}

const YoutubeChapterGenerator: React.FC<YoutubeChapterGeneratorProps> = ({ onReset }) => {
  const [transcriptionText, setTranscriptionText] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!transcriptionText.trim()) {
      alert("文字起こしテキストを入力してください");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await generateYoutubeChapter(transcriptionText);
      setGeneratedContent(result);
    } catch (error) {
      alert("生成に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Youtube className="w-8 h-8 text-red-600 mr-3" />
          Youtubeのタイムチャプターを作る
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                動画の文字起こしテキスト
              </label>
              <textarea
                value={transcriptionText}
                onChange={(e) => setTranscriptionText(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-red-600 h-40 resize-none bg-white text-slate-900"
                placeholder="ここに文字起こしテキストを貼り付けてください..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !transcriptionText.trim()}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  生成中...
                </>
              ) : (
                '生成する'
              )}
            </button>
          </div>
        </div>
      </div>

      {generatedContent && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-red-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center">
              生成結果（要約・チャプター・タグ）
            </h3>
            <div className="flex gap-2">
               <button onClick={handleSubmit} disabled={isProcessing} className="flex items-center text-white/90 hover:text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors disabled:opacity-50">
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
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="w-full h-96 p-4 bg-slate-50 rounded-xl whitespace-pre-wrap font-sans text-slate-800 border border-slate-200 leading-relaxed resize-y focus:ring-2 focus:ring-red-600 focus:bg-white transition-colors"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={copyToClipboard}
                className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all text-white shadow-md ${
                  copied ? 'bg-slate-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Clipboard className="w-5 h-5 mr-2" />}
                {copied ? 'コピーしました' : 'テキストをコピー'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeChapterGenerator;
