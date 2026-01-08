
import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Send, Loader2, Check, Clipboard, Play } from 'lucide-react';
import { createHygienistRecordChat } from '../services/geminiService';
import { Chat } from '@google/genai';

interface HygienistRecordGeneratorProps {
  onReset: () => void;
}

const HygienistRecordGenerator: React.FC<HygienistRecordGeneratorProps> = ({ onReset }) => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatEndRef, setChatEndRef] = useState<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (chatEndRef) {
      chatEndRef.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatStarted]);

  const handleStartChat = async () => {
    setChatStarted(true);
    setIsProcessing(true);
    try {
      const chat = await createHygienistRecordChat();
      setChatSession(chat);
      // Trigger the fixed greeting defined in the system prompt
      const result = await chat.sendMessage({ message: "開始" }); 
      setMessages([{ role: 'model', text: result.text || "" }]);
    } catch (e) {
      console.error(e);
      alert("チャットの開始に失敗しました");
      setChatStarted(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatSession) return;
    
    const userMsg = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsProcessing(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "" }]);
    } catch (e) {
      console.error(e);
      alert("メッセージ送信に失敗しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLastResponse = () => {
    const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
    if (lastModelMsg) {
        navigator.clipboard.writeText(lastModelMsg.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 p-6 flex-shrink-0">
        <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <ClipboardList className="w-8 h-8 text-teal-600 mr-3" />
                衛生士業務記録を作成 (SOPEN)
            </h2>
            <button onClick={onReset} className="text-slate-500 hover:text-slate-800 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                終了
            </button>
        </div>
        <p className="text-slate-500 text-sm mt-2">
            AIアシスタントが業務記録の作成をサポートします。音声入力などで断片的に話しかけてください。
        </p>
      </div>

      <div className="flex-1 bg-slate-50 border-x border-slate-200 overflow-hidden relative flex flex-col">
         {!chatStarted ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <ClipboardList className="w-16 h-16 text-teal-100 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">SOPEN形式で記録を作成</h3>
                <p className="text-slate-500 text-sm mb-6 text-center max-w-md px-4">
                    開始ボタンを押すと、AIがヒアリングを開始します。<br/>
                    患者様の主訴、所見、処置内容などを話しかけてください。
                </p>
                <button 
                    onClick={handleStartChat}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-teal-600 text-white rounded-full font-bold hover:bg-teal-700 shadow-lg flex items-center transition-transform active:scale-95"
                >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    記録作成を開始する
                </button>
            </div>
         ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                <ClipboardList className="w-4 h-4 text-teal-600" />
                            </div>
                        )}
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                            msg.role === 'user' 
                            ? 'bg-teal-600 text-white rounded-br-none border-teal-600' 
                            : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                         <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                            <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm text-slate-400 text-sm">
                            作成中...
                        </div>
                    </div>
                )}
                <div ref={(el) => setChatEndRef(el)} />
            </div>
         )}
      </div>

      <div className="bg-white border border-slate-200 rounded-b-2xl p-4 flex-shrink-0">
         {chatStarted && (
             <>
                <div className="flex gap-2 items-end">
                    <textarea 
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="例：今日は右下のSRPを行いました。TBIはフロスの使い方を..."
                        className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white text-slate-900 min-h-[50px] max-h-[150px] resize-none"
                        autoFocus
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={isProcessing || !inputMessage.trim()}
                        className="p-3 mb-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 h-[50px] w-[50px] flex items-center justify-center flex-shrink-0 shadow-sm transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400 px-1">
                    <span>Shift + Enter で送信</span>
                    {messages.length > 1 && (
                        <button 
                            onClick={copyLastResponse} 
                            className="flex items-center text-teal-600 hover:text-teal-800 font-bold"
                        >
                            {copied ? <Check className="w-3 h-3 mr-1" /> : <Clipboard className="w-3 h-3 mr-1" />}
                            {copied ? 'コピーしました' : '最新の記録をコピー'}
                        </button>
                    )}
                </div>
             </>
         )}
      </div>
    </div>
  );
};

export default HygienistRecordGenerator;
