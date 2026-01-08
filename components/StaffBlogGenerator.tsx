
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, ImagePlus, PenTool, Edit3, MessageCircle, FileText, 
  Send, Loader2, X, RefreshCw, Download, Palette, Play, Zap,
  ExternalLink, Clipboard, Check, Sparkles, PlusCircle, Upload, Monitor, Square, Smartphone
} from 'lucide-react';
import { BlogImageStyle, BlogSectionConfig } from '../types';
import { 
  createStaffBlogChat, generateBlogScenes, 
  generateBlogImage, regenerateBlogScene, ensureApiKeySelected,
  generateBlogEyecatch, generateFreeformImage, generateBlogFromPDF
} from '../services/geminiService';
import { Chat } from '@google/genai';

interface StaffBlogGeneratorProps {
  onReset: () => void;
}

const StaffBlogGenerator: React.FC<StaffBlogGeneratorProps> = ({ onReset }) => {
  // Step 1: Author
  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Style
  const [imageStyle, setImageStyle] = useState<BlogImageStyle>('ILLUSTRATION');

  // Step 3: Content
  const [contentMode, setContentMode] = useState<'CHAT' | 'MANUAL' | 'PDF'>('CHAT');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const [manualText, setManualText] = useState('');
  const [chatEndRef, setChatEndRef] = useState<HTMLDivElement | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // PDF State
  const [isGeneratingFromPdf, setIsGeneratingFromPdf] = useState(false);
  const [isPdfSuccess, setIsPdfSuccess] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // Step 4: Images
  const [sections, setSections] = useState<BlogSectionConfig[]>([]);
  const [isAnalyzingScenes, setIsAnalyzingScenes] = useState(false);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '3:4'>('16:9');

  // Step 5: Eyecatch
  const [eyecatchImage, setEyecatchImage] = useState<string | null>(null);
  const [isGeneratingEyecatch, setIsGeneratingEyecatch] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [eyecatchTitlePos, setEyecatchTitlePos] = useState('Center');
  const [eyecatchSubtitle, setEyecatchSubtitle] = useState('');
  const [eyecatchSubtitlePos, setEyecatchSubtitlePos] = useState('Below Title');

  // New Eyecatch Options
  const [eyecatchComposition, setEyecatchComposition] = useState('Rule of thirds');
  const [eyecatchMood, setEyecatchMood] = useState('Clean');
  const [eyecatchColorScheme, setEyecatchColorScheme] = useState('Blue and White');

  // Step 6: Additional Images
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [includeAuthorInAdditional, setIncludeAuthorInAdditional] = useState(true);
  const [additionalImage, setAdditionalImage] = useState<string | null>(null);
  const [isGeneratingAdditional, setIsGeneratingAdditional] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef) {
      chatEndRef.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatStarted]);

  // --- Step 1 Handlers ---
  const handleAuthorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAuthorImage(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Step 3 Handlers ---
  const handleStartChat = async () => {
    try {
      const hasKey = await ensureApiKeySelected();
      if (!hasKey) {
         alert("APIキーが必要です");
         return;
      }

      setChatStarted(true);
      setIsChatProcessing(true);
      const chat = await createStaffBlogChat();
      setChatSession(chat);
      const result = await chat.sendMessage({ message: "スタート" }); // Trigger the system prompt greeting
      setMessages([{ role: 'model', text: result.text || "" }]);
    } catch (e) {
      console.error(e);
      alert("チャットの開始に失敗しました");
      setChatStarted(false);
    } finally {
      setIsChatProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatSession) return;
    
    const userMsg = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatProcessing(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "" }]);
    } catch (e) {
      console.error(e);
      alert("メッセージ送信に失敗しました");
    } finally {
      setIsChatProcessing(false);
    }
  };

  const transferChatToEditor = () => {
     // Take the LAST response from the model
     const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
     
     if (lastModelMessage) {
         // Clean up markdown characters just in case
         const cleanText = lastModelMessage.text.replace(/[#*]/g, '');
         setManualText(cleanText);
         setContentMode('MANUAL');
         alert("最新の回答をエディタにコピーしました。\n不要な挨拶文やタイトル案などを削除して、記事本文のみに整形してください。");
     } else {
         alert("チャットの履歴がありません。");
     }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            alert('PDFファイルのみアップロード可能です');
            return;
        }

        const hasKey = await ensureApiKeySelected();
        if (!hasKey) {
           alert("APIキーが必要です");
           return;
        }

        setIsGeneratingFromPdf(true);
        setIsPdfSuccess(false);

        try {
            // Read file as base64 properly
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result as string;
                    if (result) resolve(result.split(',')[1]);
                    else reject(new Error("File reading failed"));
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const generatedText = await generateBlogFromPDF({
                mimeType: file.type,
                data: base64
            });
            
            // Success state
            setIsGeneratingFromPdf(false);
            setIsPdfSuccess(true);

            // Delay before switching to Manual mode
            setTimeout(() => {
                setManualText(generatedText);
                setContentMode('MANUAL'); 
                setIsPdfSuccess(false);
            }, 1500);

        } catch (error) {
            console.error(error);
            alert('PDFの読み込み・生成に失敗しました');
            setIsGeneratingFromPdf(false);
        } finally {
            e.target.value = ''; // Reset input
        }
    }
  };

  const handleCopyToClipboard = async () => {
    if (!manualText) return;
    try {
      await navigator.clipboard.writeText(manualText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert('コピーに失敗しました');
    }
  };

  const handleOpenGoogleDocs = async () => {
    if (!manualText) {
        alert("記事本文がありません");
        return;
    }
    // Copy to clipboard first for convenience
    try {
      await navigator.clipboard.writeText(manualText);
      // Open new Google Doc
      window.open('https://docs.new', '_blank');
      alert('本文をクリップボードにコピーしました。\n開いたGoogleドキュメントに貼り付けてください (Ctrl+V)');
    } catch (err) {
      window.open('https://docs.new', '_blank');
    }
  };

  const handleManualSubmit = async () => {
     // Proceed to image analysis
     if (manualText.trim()) {
         analyzeScenes(manualText);
         // Scroll to step 4
         const step4 = document.getElementById('step-4');
         step4?.scrollIntoView({ behavior: 'smooth' });
     } else {
         alert("記事の本文が空です");
     }
  };

  // --- Step 4 Handlers ---
  const analyzeScenes = async (article: string) => {
    try {
        const hasKey = await ensureApiKeySelected();
        if (!hasKey) {
           alert("APIキーが必要です");
           return;
        }

        setIsAnalyzingScenes(true);
        setSections([]); // Reset
        const results = await generateBlogScenes(article);
        setSections(results);
    } catch (e) {
        console.error(e);
        alert("シーン解析に失敗しました");
    } finally {
        setIsAnalyzingScenes(false);
    }
  };

  const handleUpdateSection = (index: number, field: keyof BlogSectionConfig, value: string) => {
      const newSections = [...sections];
      // @ts-ignore
      newSections[index][field] = value;
      setSections(newSections);
  };

  const handleRegenerateScene = async (index: number) => {
      const section = sections[index];
      try {
          const hasKey = await ensureApiKeySelected();
          if (!hasKey) {
             alert("APIキーが必要です");
             return;
          }

          const newConfig = await regenerateBlogScene(section.header, section.sceneDescription);
          const newSections = [...sections];
          newSections[index] = { ...section, ...newConfig };
          setSections(newSections);
      } catch (e) {
          alert("再生成失敗");
      }
  };

  const handleGenerateImage = async (index: number) => {
      const section = sections[index];
      setGeneratingImageIndex(index);
      try {
          const hasKey = await ensureApiKeySelected();
          if (!hasKey) {
             alert("APIキーが必要です"); 
             return;
          }

          const base64 = await generateBlogImage(section, imageStyle, authorImage, section.modificationInstruction, aspectRatio);
          const newSections = [...sections];
          newSections[index].imageBase64 = base64;
          setSections(newSections);
      } catch (e) {
          console.error(e);
          alert("画像生成失敗");
      } finally {
          setGeneratingImageIndex(null);
      }
  };
  
  const handleGenerateAllImages = async () => {
      try {
          const hasKey = await ensureApiKeySelected();
          if (!hasKey) {
             alert("APIキーが必要です"); 
             return;
          }

          setIsGeneratingAll(true);
          const newSections = [...sections];

          // Process sequentially to avoid potential rate limits or issues
          for (let i = 0; i < newSections.length; i++) {
              if (newSections[i].imageBase64) continue; // Skip already generated
              try {
                  setGeneratingImageIndex(i); // Update UI to show progress
                  const base64 = await generateBlogImage(newSections[i], imageStyle, authorImage, undefined, aspectRatio);
                  newSections[i].imageBase64 = base64;
                  setSections([...newSections]); // Update state incrementally
              } catch (e) {
                  console.error(`Error generating image ${i}`, e);
              }
          }
      } catch (e) {
          alert("一括生成に失敗しました");
      } finally {
          setIsGeneratingAll(false);
          setGeneratingImageIndex(null);
      }
  };

  // --- Step 5 Handlers ---
  const handleGenerateEyecatch = async () => {
    if (!manualText.trim()) {
        alert("記事本文がありません。ステップ3で記事を作成してください。");
        return;
    }
    
    try {
        const hasKey = await ensureApiKeySelected();
        if (!hasKey) {
            alert("APIキーが必要です");
            return;
        }

        setIsGeneratingEyecatch(true);
        const image = await generateBlogEyecatch(
            manualText, 
            blogTitle,
            eyecatchTitlePos,
            eyecatchSubtitle,
            eyecatchSubtitlePos,
            authorImage,
            eyecatchComposition,
            eyecatchMood,
            eyecatchColorScheme
        );
        setEyecatchImage(image);
    } catch (e) {
        console.error(e);
        alert("アイキャッチ画像の生成に失敗しました");
    } finally {
        setIsGeneratingEyecatch(false);
    }
  };

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Step 6 Handlers ---
  const handleGenerateAdditional = async () => {
    if (!additionalPrompt.trim()) return;
    try {
        const hasKey = await ensureApiKeySelected();
        if (!hasKey) { alert("APIキーが必要です"); return; }
        
        setIsGeneratingAdditional(true);
        const img = await generateFreeformImage(
            additionalPrompt, 
            imageStyle, 
            includeAuthorInAdditional ? authorImage : null,
            aspectRatio
        );
        setAdditionalImage(img);
    } catch(e) {
        alert("画像の生成に失敗しました");
    } finally {
        setIsGeneratingAdditional(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
       <div className="flex justify-between items-center mb-4">
           <h1 className="text-2xl font-bold text-slate-900">スタッフブログ作成ウィザード</h1>
           <button onClick={onReset} className="text-slate-500 hover:text-slate-800 text-sm flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
               <X className="w-4 h-4 mr-1" />
               中断して戻る
           </button>
       </div>

       {/* Step 1 */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">1</span>
            筆者設定
          </h2>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
                <p className="text-slate-600 mb-4">
                    ブログの「顔」となる著者の画像をアップロードしてください。<br/>
                    生成されるすべての画像に、著者が登場します。
                </p>
                {!authorImage ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-white hover:border-indigo-400 transition-all flex flex-col items-center group"
                    >
                        <User className="w-12 h-12 text-slate-300 group-hover:text-indigo-400 mb-3" />
                        <span className="font-bold text-slate-600 group-hover:text-indigo-600">写真をアップロード</span>
                        <span className="text-xs text-slate-400 mt-1">JPEG, PNG</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <img src={`data:image/png;base64,${authorImage}`} alt="Author" className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md" />
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">著者画像を設定済み</p>
                            <button 
                                onClick={() => setAuthorImage(null)}
                                className="text-red-500 text-xs hover:underline mt-1"
                            >
                                削除して変更
                            </button>
                        </div>
                    </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAuthorUpload} />
            </div>
          </div>
        </div>

       {/* Step 2 */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">2</span>
            見出し画像のテイスト
          </h2>
          <p className="text-slate-600 mb-4 text-sm">ブログの見出しに使用する画像のスタイルを選んでください。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { id: 'ILLUSTRATION', label: 'イラスト', desc: '温かみのある水彩・フラット風', icon: ImagePlus },
               { id: 'MANGA_MODERN', label: '漫画（モダン）', desc: '現代的なウェブトゥーン風', icon: PenTool },
               { id: 'MANGA_GEKIGA', label: '漫画（劇画）', desc: '書き込みの多いシリアス風', icon: PenTool },
               { id: 'MANGA_POP', label: '漫画（アメコミ）', desc: 'ポップでカラフルなアメコミ風', icon: Palette },
             ].map((style) => (
               <button
                 key={style.id}
                 onClick={() => setImageStyle(style.id as BlogImageStyle)}
                 className={`p-4 rounded-xl border-2 text-left transition-all ${
                    imageStyle === style.id 
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                 }`}
               >
                 <style.icon className={`w-6 h-6 mb-3 ${imageStyle === style.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                 <div className="font-bold text-slate-800 text-sm">{style.label}</div>
                 <div className="text-xs text-slate-500 mt-1">{style.desc}</div>
               </button>
             ))}
          </div>
        </div>

       {/* Step 3 */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[600px] flex flex-col">
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
             <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">3</span>
                記事作成（音声入力推奨）
             </h2>
             <div className="flex bg-slate-100 rounded-lg p-1 overflow-x-auto">
                <button 
                  onClick={() => setContentMode('CHAT')}
                  className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${contentMode === 'CHAT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  AIと対話して作成
                </button>
                <button 
                  onClick={() => setContentMode('PDF')}
                  className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${contentMode === 'PDF' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  PDFから作成
                </button>
                <button 
                  onClick={() => setContentMode('MANUAL')}
                  className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap transition-all ${contentMode === 'MANUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  エディタ (確認・修正)
                </button>
             </div>
           </div>

           {contentMode === 'CHAT' ? (
             <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl overflow-hidden flex flex-col relative shadow-inner">
                {!chatStarted ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                        <MessageCircle className="w-16 h-16 text-indigo-100 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">インタビュアーAIと会話する</h3>
                        <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
                            AIが編集者となって、あなたに質問を投げかけます。<br/>
                            回答するだけで、ブログ記事が完成します。
                        </p>
                        <button 
                            onClick={handleStartChat}
                            disabled={isChatProcessing}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 shadow-lg flex items-center transition-transform active:scale-95"
                        >
                            {isChatProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                            インタビューを開始する
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                        <MessageCircle className="w-4 h-4 text-indigo-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none border-indigo-600' 
                                    : 'bg-slate-50 text-slate-800 border-slate-200 rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatProcessing && (
                            <div className="flex justify-start">
                                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm text-slate-400 text-sm">
                                    入力中...
                                </div>
                            </div>
                        )}
                        <div ref={(el) => setChatEndRef(el)} />
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex gap-2 items-end">
                                <textarea 
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="回答を入力..."
                                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 min-h-[50px] max-h-[150px] resize-none"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={isChatProcessing || !inputMessage.trim()}
                                    className="p-3 mb-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 h-[50px] w-[50px] flex items-center justify-center flex-shrink-0 shadow-sm"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-2 flex justify-end">
                                 <button 
                                    onClick={transferChatToEditor}
                                    className="text-xs text-green-600 hover:text-green-800 hover:underline font-bold flex items-center"
                                 >
                                    <FileText className="w-3 h-3 mr-1" />
                                    最新の回答をエディタにコピーして確認
                                 </button>
                            </div>
                        </div>
                    </>
                )}
             </div>
           ) : contentMode === 'PDF' ? (
             <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl overflow-hidden flex flex-col relative shadow-inner p-8 items-center justify-center">
                 <div className="max-w-md w-full text-center">
                     <div className="mb-6 flex justify-center">
                         <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
                             <FileText className="w-10 h-10 text-indigo-500" />
                         </div>
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 mb-2">PDFからブログ記事を作成</h3>
                     <p className="text-slate-500 text-sm mb-8">
                         論文や資料のPDFをアップロードしてください。<br/>
                         AIが内容を読み取り、患者様向けのブログ記事にリライトします。
                     </p>
                     
                     {isGeneratingFromPdf ? (
                         <div className="flex flex-col items-center p-8 bg-slate-50 rounded-xl border border-slate-200 animate-pulse">
                             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                             <p className="font-bold text-slate-700 text-lg">テキストを生成中...</p>
                             <p className="text-xs text-slate-500 mt-2">論文の内容を解析しています</p>
                         </div>
                     ) : isPdfSuccess ? (
                         <div className="flex flex-col items-center p-8 bg-green-50 rounded-xl border border-green-200 animate-in zoom-in duration-300">
                             <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-6 h-6 text-green-600" />
                             </div>
                             <p className="font-bold text-green-800 text-lg">テキスト生成完了！</p>
                             <p className="text-xs text-green-600 mt-2">エディタに移動します...</p>
                         </div>
                     ) : (
                         <div className="relative">
                             <button 
                                 onClick={() => pdfInputRef.current?.click()}
                                 className="w-full py-4 border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-700 font-bold flex items-center justify-center transition-colors"
                             >
                                 <Upload className="w-5 h-5 mr-2" />
                                 PDFファイルを選択
                             </button>
                             <input 
                                 ref={pdfInputRef} 
                                 type="file" 
                                 accept="application/pdf" 
                                 className="hidden" 
                                 onChange={handlePdfUpload}
                             />
                         </div>
                     )}
                 </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col min-h-[400px]">
                <div className="bg-orange-50 p-4 rounded-t-xl border border-orange-200 text-orange-800 text-xs md:text-sm">
                   <strong>確認:</strong> 余分なチャットの会話、挨拶、タイトル案などを削除し、<strong>記事の本文のみ</strong>にしてください。<br/>
                   AIはこのテキストの見出し（H2など）を解析して画像を生成します。
                </div>
                <textarea 
                   value={manualText}
                   onChange={(e) => setManualText(e.target.value)}
                   className="w-full flex-1 p-4 border border-slate-300 border-t-0 rounded-b-xl focus:ring-2 focus:ring-indigo-500 resize-none font-sans leading-relaxed text-base bg-white text-slate-900"
                   placeholder="ここにブログの本文を貼り付けてください..."
                />
                
                {/* Export / Action Buttons */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div className="flex gap-2">
                     <button
                       onClick={handleCopyToClipboard}
                       disabled={!manualText.trim()}
                       className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-bold flex items-center transition-colors shadow-sm disabled:opacity-50"
                     >
                       {isCopied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Clipboard className="w-4 h-4 mr-2" />}
                       {isCopied ? 'コピーしました' : 'クリップボードにコピー'}
                     </button>
                     <button
                       onClick={handleOpenGoogleDocs}
                       disabled={!manualText.trim()}
                       className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-bold flex items-center transition-colors shadow-sm disabled:opacity-50"
                     >
                       <ExternalLink className="w-4 h-4 mr-2" />
                       Google ドキュメント作成 (コピーして開く)
                     </button>
                   </div>

                   <button 
                     onClick={handleManualSubmit}
                     className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center"
                   >
                     <ImagePlus className="w-5 h-5 mr-2" />
                     記事を確定して画像生成へ
                   </button>
                </div>
             </div>
           )}
        </div>

       {/* Step 4 */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[200px]" id="step-4">
           <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center mb-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">4</span>
                    画像生成
                </h2>
                <p className="text-slate-600 text-sm">記事の見出しごとに画像を生成します。</p>
             </div>
             
             {/* Aspect Ratio Selector */}
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 mb-2">画像サイズを選択</span>
                  <div className="flex gap-2">
                    <button
                        onClick={() => setAspectRatio("16:9")}
                        className={`flex items-center px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            aspectRatio === "16:9" 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Monitor className="w-4 h-4 mr-1.5" />
                        16:9 (横長)
                    </button>
                    <button
                        onClick={() => setAspectRatio("1:1")}
                        className={`flex items-center px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            aspectRatio === "1:1" 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Square className="w-4 h-4 mr-1.5" />
                        1:1 (正方形)
                    </button>
                    <button
                        onClick={() => setAspectRatio("3:4")}
                        className={`flex items-center px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            aspectRatio === "3:4" 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Smartphone className="w-4 h-4 mr-1.5" />
                        3:4 (縦長)
                    </button>
                  </div>
                </div>

                {sections.length > 0 && !isAnalyzingScenes && (
                  <button
                      onClick={handleGenerateAllImages}
                      disabled={isGeneratingAll || generatingImageIndex !== null}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all transform active:scale-95 sm:mt-0"
                  >
                      {isGeneratingAll ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                      画像を全件一括生成
                  </button>
                )}
             </div>
           </div>

           {isAnalyzingScenes ? (
               <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                   <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                   <p className="font-bold text-slate-700">記事を解析してシーンを提案中...</p>
               </div>
           ) : sections.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                   <FileText className="w-16 h-16 mb-4 opacity-50" />
                   <p className="font-bold mb-2">記事がまだ確定されていません</p>
                   <p className="text-sm">ステップ3で「記事を確定して画像生成へ」ボタンを押してください</p>
               </div>
           ) : (
               <div className="space-y-12">
                   {sections.map((section, idx) => (
                       <div key={idx} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-bold text-lg flex justify-between items-center">
                               <span className="truncate mr-4">{section.header}</span>
                               <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded whitespace-nowrap">見出し {idx + 1}</span>
                           </div>
                           
                           <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                               {/* Config Column */}
                               <div className="space-y-4">
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase">シーンの説明 (AI提案・日本語)</label>
                                       <div className="flex gap-2 mt-1">
                                           <textarea 
                                              value={section.sceneDescription}
                                              onChange={(e) => handleUpdateSection(idx, 'sceneDescription', e.target.value)}
                                              className="flex-1 p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900"
                                              rows={3}
                                           />
                                           <button 
                                              onClick={() => handleRegenerateScene(idx)}
                                              className="p-2 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 flex flex-col items-center justify-center w-12 flex-shrink-0"
                                              title="シーン案を再生成"
                                           >
                                               <RefreshCw className="w-4 h-4 mb-1" />
                                           </button>
                                       </div>
                                   </div>
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase">セリフ / キャプション (日本語)</label>
                                       <input 
                                          type="text" 
                                          value={section.caption}
                                          onChange={(e) => handleUpdateSection(idx, 'caption', e.target.value)}
                                          className="w-full mt-1 p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                       />
                                   </div>

                                   {/* Modification Instructions */}
                                   <div>
                                       <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                           <Edit3 className="w-3 h-3 mr-1" />
                                           修正指示（再生成用）
                                       </label>
                                       <textarea
                                           placeholder="例: 背景をもっと明るくして、人物を右側に寄せて"
                                           value={section.modificationInstruction || ''}
                                           onChange={(e) => handleUpdateSection(idx, 'modificationInstruction', e.target.value)}
                                           className="w-full mt-1 p-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900 placeholder:text-slate-400"
                                           rows={2}
                                       />
                                   </div>
                                   
                                   <button 
                                     onClick={() => handleGenerateImage(idx)}
                                     disabled={generatingImageIndex === idx || isGeneratingAll}
                                     className={`w-full py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center mt-2 shadow-md transition-colors ${
                                         section.imageBase64 
                                         ? 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50' 
                                         : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                     }`}
                                   >
                                      {generatingImageIndex === idx ? (
                                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                      ) : (
                                          section.imageBase64 ? <RefreshCw className="w-5 h-5 mr-2" /> : <ImagePlus className="w-5 h-5 mr-2" />
                                      )}
                                      {section.imageBase64 ? "画像を再生成" : "画像を生成"}
                                   </button>
                               </div>

                               {/* Image Result Column */}
                               <div className="bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center relative min-h-[300px]">
                                   {section.imageBase64 ? (
                                       <div className={`w-full ${aspectRatio === '1:1' ? 'aspect-square max-w-[300px]' : aspectRatio === '3:4' ? 'aspect-[3/4] max-w-[260px]' : 'aspect-video'} relative`}>
                                          <img 
                                            src={`data:image/png;base64,${section.imageBase64}`} 
                                            className="w-full h-full object-cover rounded-xl"
                                            alt="Generated" 
                                          />
                                          <button 
                                            onClick={() => downloadImage(section.imageBase64!, `blog-image-${idx}.png`)}
                                            className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg text-indigo-600 shadow-lg hover:text-indigo-800"
                                          >
                                              <Download className="w-5 h-5" />
                                          </button>
                                       </div>
                                   ) : (
                                       <div className="text-slate-400 text-center p-4">
                                           <ImagePlus className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                           <p className="text-sm">画像はまだ生成されていません</p>
                                       </div>
                                   )}
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </div>

       {/* Step 5 */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="mb-6">
             <h2 className="text-xl font-bold text-slate-900 flex items-center mb-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">5</span>
                アイキャッチ画像
             </h2>
             <p className="text-slate-600 text-sm">
                記事の顔となるアイキャッチ画像を、著者の写真と本文の雰囲気から自動生成します。
             </p>
           </div>

           <div className="flex flex-col items-center">
              {eyecatchImage ? (
                  <div className="w-full max-w-2xl">
                     <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-md border border-slate-200 mb-4">
                         <img src={`data:image/png;base64,${eyecatchImage}`} className="w-full h-full object-cover" alt="Eyecatch" />
                     </div>
                     <div className="flex gap-4">
                         <button 
                            onClick={() => downloadImage(eyecatchImage, 'eyecatch.png')}
                            className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 flex items-center justify-center"
                         >
                            <Download className="w-4 h-4 mr-2" />
                            画像を保存
                         </button>
                         <button 
                            onClick={handleGenerateEyecatch}
                            disabled={isGeneratingEyecatch}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center disabled:opacity-50"
                         >
                            {isGeneratingEyecatch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                            再生成
                         </button>
                     </div>
                  </div>
              ) : (
                  <div className="w-full max-w-lg text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                     <Sparkles className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                     <p className="text-slate-500 mb-6 font-medium">おしゃれで洗練されたデザインの<br/>アイキャッチ画像を生成します</p>
                     
                     <div className="mb-6 px-4 space-y-4">
                         {/* Title & Position */}
                         <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">ブログのタイトル</label>
                                <input 
                                    type="text" 
                                    value={blogTitle}
                                    onChange={(e) => setBlogTitle(e.target.value)}
                                    placeholder="例：ホワイトニングの秘訣"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">配置</label>
                                <select 
                                    value={eyecatchTitlePos}
                                    onChange={(e) => setEyecatchTitlePos(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
                                >
                                    <option value="Top">上1/3</option>
                                    <option value="Center">中央</option>
                                    <option value="Bottom">下1/3</option>
                                </select>
                            </div>
                         </div>
                         
                         {/* Subtitle & Position */}
                         <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">サブタイトル (任意)</label>
                                <input 
                                    type="text" 
                                    value={eyecatchSubtitle}
                                    onChange={(e) => setEyecatchSubtitle(e.target.value)}
                                    placeholder="例：当院での取り組み"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-left">配置</label>
                                <select 
                                    value={eyecatchSubtitlePos}
                                    onChange={(e) => setEyecatchSubtitlePos(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900"
                                >
                                    <option value="Below Title">タイトルの下</option>
                                    <option value="Footer">フッター</option>
                                </select>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">構図</label>
                                <select value={eyecatchComposition} onChange={(e) => setEyecatchComposition(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm">
                                    <option value="Rule of thirds">3分割法 (バランス重視)</option>
                                    <option value="Negative space">余白重視 (高級感・モダン)</option>
                                    <option value="Center">日の丸構図 (インパクト)</option>
                                    <option value="Symmetrical">左右対称 (安定感)</option>
                                    <option value="Diagonal">対角線構図 (動き・リズム)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">雰囲気</label>
                                <select value={eyecatchMood} onChange={(e) => setEyecatchMood(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm">
                                    <option value="Clean">清潔感 (Clean)</option>
                                    <option value="Trustworthy">信頼感 (Trustworthy)</option>
                                    <option value="Warm">温かみ (Warm)</option>
                                    <option value="Luxury">プロフェッショナル・高級感 (Luxury)</option>
                                    <option value="Friendly">親しみやすさ (Friendly)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">配色</label>
                                <select value={eyecatchColorScheme} onChange={(e) => setEyecatchColorScheme(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm">
                                    <option value="Blue and White">青と白 (歯科の王道)</option>
                                    <option value="Pastel">パステル (小児・優しい)</option>
                                    <option value="Gold and White">ゴールド＆白 (審美・高級)</option>
                                    <option value="Green and Natural">緑とナチュラル (予防・安心)</option>
                                    <option value="Monochrome">モノクローム (スタイリッシュ)</option>
                                </select>
                            </div>
                         </div>
                     </div>

                     <button 
                        onClick={handleGenerateEyecatch}
                        disabled={isGeneratingEyecatch}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold shadow-lg hover:from-indigo-600 hover:to-purple-700 flex items-center mx-auto transition-transform active:scale-95 disabled:opacity-50"
                     >
                        {isGeneratingEyecatch ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                        アイキャッチを生成
                     </button>
                  </div>
              )}
           </div>
        </div>

       {/* Step 6 */}
       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
           <div className="mb-6">
             <h2 className="text-xl font-bold text-slate-900 flex items-center mb-2">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">6</span>
                追加の画像を生成する
             </h2>
             <p className="text-slate-600 text-sm">
                記事の中で使う挿絵や、特定のシーンの画像を追加で生成できます。
             </p>
           </div>

           <div className="space-y-4">
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                  <span className="text-xs font-bold text-slate-500">画像サイズを選択</span>
                  <div className="flex gap-2">
                    <button
                        onClick={() => setAspectRatio("16:9")}
                        className={`flex items-center px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            aspectRatio === "16:9" 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Monitor className="w-4 h-4 mr-1.5" />
                        16:9
                    </button>
                    <button
                        onClick={() => setAspectRatio("1:1")}
                        className={`flex items-center px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            aspectRatio === "1:1" 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Square className="w-4 h-4 mr-1.5" />
                        1:1
                    </button>
                    <button
                        onClick={() => setAspectRatio("3:4")}
                        className={`flex items-center px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                            aspectRatio === "3:4" 
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <Smartphone className="w-4 h-4 mr-1.5" />
                        3:4
                    </button>
                  </div>
               </div>

               <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">画像のイメージ (日本語で具体的に)</label>
                   <textarea 
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900 bg-white"
                      rows={3}
                      placeholder="例：待合室で談笑する患者さんと受付スタッフ"
                   />
               </div>
               
               <div className="flex items-center space-x-2">
                   <input 
                      type="checkbox" 
                      id="includeAuthor"
                      checked={includeAuthorInAdditional}
                      onChange={(e) => setIncludeAuthorInAdditional(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                   />
                   <label htmlFor="includeAuthor" className="text-sm font-bold text-slate-700 cursor-pointer">
                      著者を登場させる (ステップ1の画像を使用)
                   </label>
               </div>
               
               <button 
                 onClick={handleGenerateAdditional}
                 disabled={isGeneratingAdditional || !additionalPrompt.trim()}
                 className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isGeneratingAdditional ? (
                      <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          生成中...
                      </>
                  ) : (
                      <>
                          <PlusCircle className="w-5 h-5 mr-2" />
                          画像を生成
                      </>
                  )}
               </button>
           </div>
           
           {additionalImage && (
               <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <h3 className="font-bold text-slate-700 mb-4">生成結果</h3>
                   <div className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative mx-auto ${aspectRatio === '1:1' ? 'aspect-square max-w-[400px]' : aspectRatio === '3:4' ? 'aspect-[3/4] max-w-[320px]' : 'aspect-video max-w-2xl'}`}>
                       <img src={`data:image/png;base64,${additionalImage}`} className="w-full h-full object-cover" alt="Additional" />
                       <button 
                        onClick={() => downloadImage(additionalImage, 'additional-image.png')}
                        className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg text-indigo-600 shadow-lg hover:text-indigo-800"
                       >
                           <Download className="w-5 h-5" />
                       </button>
                   </div>
               </div>
           )}
        </div>
    </div>
  );
};

export default StaffBlogGenerator;
