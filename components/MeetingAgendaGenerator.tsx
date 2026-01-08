
import React, { useState, useEffect, useRef } from 'react';
import { Users, Loader2, Check, Clipboard, Send, Play, FileText } from 'lucide-react';
import { createMeetingAgendaChat } from '../services/geminiService';
import { Chat } from '@google/genai';

interface MeetingAgendaGeneratorProps {
  onReset: () => void;
}

const MeetingAgendaGenerator: React.FC<MeetingAgendaGeneratorProps> = ({ onReset }) => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [initialTopic, setInitialTopic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatEndRef, setChatEndRef] = useState<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedAgenda, setCopiedAgenda] = useState(false);

  useEffect(() => {
    if (chatEndRef) {
      chatEndRef.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatStarted]);

  const handleStartChat = async () => {
    if (!initialTopic.trim()) {
        alert("議題の種を入力してください");
        return;
    }

    setChatStarted(true);
    setIsProcessing(true);
    try {
      const chat = await createMeetingAgendaChat();
      setChatSession(chat);
      
      // Add initial topic as first user message and send it
      setMessages([{ role: 'user', text: initialTopic }]);
      const result = await chat.sendMessage({ message: initialTopic }); 
      setMessages(prev => [...prev, { role: 'model', text: result.text || "" }]);
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

  const copyAgendaOnly = () => {
    const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
    if (lastModelMsg) {
        let text = lastModelMsg.text;
        // Search for the start of the agenda format
        const startMarker = "1. タイトル";
        const idx = text.indexOf(startMarker);
        
        if (idx !== -1) {
            text = text.substring(idx);
        } else {
            // If marker not found, we might want to alert or just copy everything.
            // For now, copying everything ensures the user gets something, 
            // but ideally the model follows the format.
        }
        
        navigator.clipboard.writeText(text);
        setCopiedAgenda(true);
        setTimeout(() => setCopiedAgenda(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-200 p-6 flex-shrink-0">
        <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <Users className="w-8 h-8 text-purple-600 mr-3" />
                ミーティング議案を作成
            </h2>
            <button onClick={onReset} className="text-slate-500 hover:text-slate-800 text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                終了
            </button>
        </div>
        <p className="text-slate-600 text-sm mt-2">
            AIが「戦略的ファシリテーター」となり、対話を通じて決定事項を明確にした議題シートを作成します。
        </p>
      </div>

      <div className="flex-1 bg-slate-50 border-x border-slate-200 overflow-hidden relative flex flex-col">
         {!chatStarted ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8">
                <Users className="w-16 h-16 text-purple-100 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-4">議題の種（トピックス）を入力</h3>
                <p className="text-slate-500 text-sm mb-6 text-center max-w-lg">
                    スタッフからの意見、クレーム、改善したいことなどを自由に入力してください。<br/>
                    AIが足りない情報を質問して整理します。
                </p>
                <div className="w-full max-w-2xl">
                    <textarea 
                        value={initialTopic}
                        onChange={(e) => setInitialTopic(e.target.value)}
                        className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 h-40 resize-none bg-slate-50 text-slate-900 mb-6"
                        placeholder="例：受付の電話対応が長くて患者さんを待たせてしまっている。自動釣銭機の導入を検討したいがコストが心配。"
                    />
                    <button 
                        onClick={handleStartChat}
                        disabled={isProcessing || !initialTopic.trim()}
                        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg flex items-center justify-center transition-transform active:scale-95 text-lg"
                    >
                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                        ファシリテーターと対話を開始
                    </button>
                </div>
            </div>
         ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                        )}
                        <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                            msg.role === 'user' 
                            ? 'bg-purple-600 text-white rounded-br-none border-purple-600' 
                            : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                         <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm text-slate-400 text-sm">
                            思考中...
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
                        placeholder="回答を入力..."
                        className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-slate-900 min-h-[60px] max-h-[150px] resize-none"
                        autoFocus
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={isProcessing || !inputMessage.trim()}
                        className="p-3 mb-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 h-[60px] w-[60px] flex items-center justify-center flex-shrink-0 shadow-sm transition-colors"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-400 px-1 items-center">
                    <span>Shift + Enter で送信</span>
                    {messages.length > 0 && (
                        <div className="flex gap-4">
                            <button 
                                onClick={copyAgendaOnly} 
                                className="flex items-center text-purple-600 hover:text-purple-800 font-bold bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md transition-colors"
                                title="「1. タイトル」以降のテキストのみをコピーします"
                            >
                                {copiedAgenda ? <Check className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                {copiedAgenda ? 'コピーしました' : '議題シートのみコピー'}
                            </button>
                            <button 
                                onClick={copyLastResponse} 
                                className="flex items-center text-slate-500 hover:text-slate-700"
                            >
                                {copied ? <Check className="w-3 h-3 mr-1" /> : <Clipboard className="w-3 h-3 mr-1" />}
                                {copied ? '完了' : '全文コピー'}
                            </button>
                        </div>
                    )}
                </div>
             </>
         )}
      </div>
    </div>
  );
};

export default MeetingAgendaGenerator;
