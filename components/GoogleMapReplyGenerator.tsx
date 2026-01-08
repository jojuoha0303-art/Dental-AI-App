
import React, { useState } from 'react';
import { MapPin, Loader2, Check, Clipboard, RefreshCw, MessageSquarePlus } from 'lucide-react';
import { generateGoogleMapReply } from '../services/geminiService';

interface GoogleMapReplyGeneratorProps {
  onReset: () => void;
}

const GoogleMapReplyGenerator: React.FC<GoogleMapReplyGeneratorProps> = ({ onReset }) => {
  const [reviewContent, setReviewContent] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [generatedReply, setGeneratedReply] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!reviewContent.trim()) {
      alert("口コミの内容を入力してください");
      return;
    }

    setIsProcessing(true);
    try {
      // Pass empty string for reviewer name as it is no longer collected
      const reply = await generateGoogleMapReply('', reviewContent, additionalMessage);
      setGeneratedReply(reply);
    } catch (error) {
      alert("返信の生成に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedReply) {
      navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <MapPin className="w-8 h-8 text-red-500 mr-3" />
          Google map 口コミへの返信を作成
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                口コミの内容
              </label>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-40 resize-none bg-white text-slate-900"
                placeholder="例: 親知らずの抜歯で来院しました。先生の説明が丁寧で、痛みもほとんどありませんでした。ありがとうございました。"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                <MessageSquarePlus className="w-4 h-4 mr-2 text-red-500" />
                担当者から伝えたい言葉 (任意)
              </label>
              <textarea
                value={additionalMessage}
                onChange={(e) => setAdditionalMessage(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-24 resize-none bg-white text-slate-900"
                placeholder="例: 遠方からお越しいただきありがとうございます。 / 駐車場のご利用について、不便をおかけし申し訳ありません。"
              />
              <p className="text-xs text-slate-500 mt-1">
                ※ここに入力した内容は、生成される返信メッセージの中に自然な形で組み込まれます。
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !reviewContent.trim()}
              className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  生成中...
                </>
              ) : (
                '返信を作成'
              )}
            </button>
          </div>
        </div>
      </div>

      {generatedReply && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-red-500 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center">
              生成された返信
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
              value={generatedReply}
              onChange={(e) => setGeneratedReply(e.target.value)}
              className="w-full h-64 p-4 bg-slate-50 rounded-xl whitespace-pre-wrap font-sans text-slate-800 border border-slate-200 leading-relaxed resize-y focus:ring-2 focus:ring-red-500 focus:bg-white transition-colors"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={copyToClipboard}
                className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all text-white shadow-md ${
                  copied ? 'bg-slate-800' : 'bg-red-500 hover:bg-red-600'
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

export default GoogleMapReplyGenerator;
