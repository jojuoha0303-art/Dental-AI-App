
import React, { useState, useRef } from 'react';
import { Newspaper, Loader2, RefreshCw, ImagePlus, X, Download, Monitor, Smartphone, MapPin, Phone, Globe, User, Camera, Square, CalendarClock } from 'lucide-react';
import { generateFlyer, ensureApiKeySelected } from '../services/geminiService';
import { FlyerAspectRatio, FlyerComposition, FlyerMood, FlyerColorScheme, InputFile, StaffImage, FlyerTextPosition } from '../types';

interface FlyerGeneratorProps {
  onReset: () => void;
}

interface GenerationResult {
  ratio: FlyerAspectRatio;
  images: string[];
}

const FlyerGenerator: React.FC<FlyerGeneratorProps> = ({ onReset }) => {
  // 1. Layout
  const [selectedRatios, setSelectedRatios] = useState<FlyerAspectRatio[]>(['3:4']);

  // 1.5 Text Fields with Positions
  const [flyerTitle, setFlyerTitle] = useState('');
  const [titlePos, setTitlePos] = useState<FlyerTextPosition>('Header');
  
  const [flyerSubtitle, setFlyerSubtitle] = useState('');
  const [subtitlePos, setSubtitlePos] = useState<FlyerTextPosition>('Top');

  const [flyerBody, setFlyerBody] = useState('');

  // 2. Info (Generic)
  const [mainInfo, setMainInfo] = useState(''); // e.g. Clinic Name / Seminar Name
  const [subInfo, setSubInfo] = useState(''); // e.g. Address / Location
  const [subInfo2, setSubInfo2] = useState(''); // e.g. Date / Time
  const [tel, setTel] = useState('');
  const [url, setUrl] = useState('');

  // 3. Images (Split)
  const [staffImages, setStaffImages] = useState<StaffImage[]>([]);
  const [landscapeImages, setLandscapeImages] = useState<InputFile[]>([]);
  
  const staffInputRef = useRef<HTMLInputElement>(null);
  const landscapeInputRef = useRef<HTMLInputElement>(null);

  // 4. Design Config
  const [subjectDesc, setSubjectDesc] = useState('');
  const [composition, setComposition] = useState<FlyerComposition>('Rule of thirds');
  const [mood, setMood] = useState<FlyerMood>('Clean');
  const [colorScheme, setColorScheme] = useState<FlyerColorScheme>('Blue and White');

  // Result
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Handlers ---

  const toggleRatio = (ratio: FlyerAspectRatio) => {
    setSelectedRatios(prev => {
      if (prev.includes(ratio)) {
        // Prevent deselecting the last one
        if (prev.length === 1) return prev;
        return prev.filter(r => r !== ratio);
      } else {
        return [...prev, ratio];
      }
    });
  };

  const handleStaffUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          const base64 = result.split(',')[1];
          const newStaff: StaffImage = {
             file: { mimeType: file.type, data: base64 },
             name: '',
             jobTitle: ''
          };
          setStaffImages(prev => [...prev, newStaff]);
        }
      };
      reader.readAsDataURL(file);
      // clear value to allow re-upload
      e.target.value = '';
    }
  };

  const updateStaffInfo = (index: number, field: 'name' | 'jobTitle', value: string) => {
      setStaffImages(prev => {
          const next = [...prev];
          next[index] = { ...next[index], [field]: value };
          return next;
      });
  };

  const removeStaff = (index: number) => {
      setStaffImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLandscapeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      
      try {
        const filePromises = fileList.map((file: File) => new Promise<InputFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
             const result = event.target?.result as string;
             if (result) {
                 const base64 = result.split(',')[1];
                 resolve({ mimeType: file.type, data: base64 });
             } else {
                 reject(new Error("File read failed"));
             }
          };
          reader.onerror = () => reject(new Error("File read error"));
          reader.readAsDataURL(file);
        }));
  
        const newFiles = await Promise.all(filePromises);
        setLandscapeImages(prev => [...prev, ...newFiles]);
      } catch (error) {
        console.error("Error reading files:", error);
        alert("画像の読み込みに失敗しました");
      }
      
      // Reset input
      e.target.value = '';
    }
  };

  const removeLandscape = (index: number) => {
    setLandscapeImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!mainInfo.trim()) {
      alert("メイン情報は必須です");
      return;
    }
    if (!flyerTitle.trim()) {
        alert("タイトルは必須です");
        return;
    }
    if (selectedRatios.length === 0) {
        alert("サイズを少なくとも1つ選択してください");
        return;
    }

    try {
      const hasKey = await ensureApiKeySelected();
      if (!hasKey) {
        alert("画像生成にはAPIキーが必要です");
        return;
      }

      setIsProcessing(true);
      setResults([]);

      const newResults: GenerationResult[] = [];

      // Generate for each selected ratio
      // We process them sequentially to avoid overwhelming the browser/API connection
      for (const ratio of selectedRatios) {
          try {
            const images = await generateFlyer(
                ratio,
                flyerTitle,
                titlePos,
                flyerSubtitle,
                subtitlePos,
                flyerBody,
                mainInfo,
                subInfo,
                subInfo2,
                tel,
                url,
                staffImages,
                landscapeImages,
                subjectDesc,
                composition,
                mood,
                colorScheme
            );
            if (images.length > 0) {
                newResults.push({ ratio, images });
                // Update state incrementally so user sees progress
                setResults([...newResults]); 
            }
          } catch (e) {
              console.error(`Failed to generate for ${ratio}`, e);
          }
      }

      if (newResults.length === 0) {
        alert("画像の生成に失敗しました");
      }
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(false);
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

  const getAspectClass = (ratio: FlyerAspectRatio) => {
      switch(ratio) {
          case '3:4': return 'aspect-[3/4]';
          case '4:3': return 'aspect-[4/3]';
          case '16:9': return 'aspect-video';
          case '9:16': return 'aspect-[9/16] max-w-[300px] mx-auto';
          case '1:1': return 'aspect-square max-w-sm mx-auto';
          default: return 'aspect-[3/4]';
      }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
          <Newspaper className="w-8 h-8 text-indigo-600 mr-3" />
          チラシを作成
        </h2>

        <div className="space-y-8">
          {/* Step 1: Layout */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-2">1</span>
              サイズ選択 (複数選択可)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                  { r: '3:4', label: '縦長 (3:4)', icon: Smartphone },
                  { r: '4:3', label: '横長 (4:3)', icon: Monitor },
                  { r: '16:9', label: 'ワイド (16:9)', icon: Monitor },
                  { r: '1:1', label: '正方形 (1:1)', icon: Square },
                  { r: '9:16', label: '縦長 (9:16)', icon: Smartphone },
              ].map((opt) => {
                const isSelected = selectedRatios.includes(opt.r as FlyerAspectRatio);
                return (
                    <button
                        key={opt.r}
                        onClick={() => toggleRatio(opt.r as FlyerAspectRatio)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                        isSelected 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 ring-offset-1' 
                            : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-600'
                        }`}
                    >
                        <opt.icon className="w-5 h-5 mb-1" />
                        <span className="font-bold text-xs">{opt.label}</span>
                        {isSelected && <div className="mt-1 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                    </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Content Text */}
          <div>
             <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
               <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-2">2</span>
               チラシの内容 (テキスト)
             </h3>
             <div className="space-y-4">
                 <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">タイトル *</label>
                        <input
                        type="text"
                        value={flyerTitle}
                        onChange={(e) => setFlyerTitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                        placeholder="例: 内覧会のお知らせ"
                        />
                     </div>
                     <div className="w-1/3">
                        <label className="block text-xs font-bold text-slate-500 mb-1">配置</label>
                        <select 
                            value={titlePos} 
                            onChange={(e) => setTitlePos(e.target.value as FlyerTextPosition)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                        >
                            <option value="Header">ヘッダー (最上部)</option>
                            <option value="Top">上部</option>
                            <option value="MiddleBottom">中・下部</option>
                        </select>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1">サブタイトル</label>
                        <input
                        type="text"
                        value={flyerSubtitle}
                        onChange={(e) => setFlyerSubtitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                        placeholder="例: 11月24日(日) 開催！"
                        />
                     </div>
                     <div className="w-1/3">
                        <label className="block text-xs font-bold text-slate-500 mb-1">配置</label>
                        <select 
                            value={subtitlePos} 
                            onChange={(e) => setSubtitlePos(e.target.value as FlyerTextPosition)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                        >
                            <option value="Header">ヘッダー (最上部)</option>
                            <option value="Top">上部</option>
                            <option value="MiddleBottom">中・下部</option>
                        </select>
                     </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">本文（箇条書き表示）</label>
                    <textarea
                      value={flyerBody}
                      onChange={(e) => setFlyerBody(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none h-24 bg-white text-slate-900"
                      placeholder="例: &#13;・普段見れない院内を見学できます&#13;・歯科相談会も同時開催&#13;・お子様には風船プレゼント"
                    />
                 </div>
             </div>
          </div>

          {/* Step 3: Images (Split) */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-2">3</span>
              写真素材
            </h3>
            
            <div className="space-y-6">
                {/* 3.1 People / Staff */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center text-sm">
                        <User className="w-4 h-4 mr-2" />
                        人物・スタッフ写真
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">院長やスタッフの写真をアップロードし、役職と名前を指定してください。</p>
                    
                    <div className="space-y-3">
                        {staffImages.map((staff, idx) => (
                            <div key={idx} className="flex gap-4 items-start bg-white p-3 rounded-lg border border-slate-200">
                                <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded overflow-hidden">
                                     <img src={`data:${staff.file.mimeType};base64,${staff.file.data}`} className="w-full h-full object-cover" />
                                     <button onClick={() => removeStaff(idx)} className="absolute top-0 right-0 bg-white/80 p-1 text-red-500 hover:bg-red-50"><X className="w-3 h-3" /></button>
                                </div>
                                <div className="flex-1 space-y-2">
                                     <div>
                                        <input 
                                          type="text" 
                                          placeholder="役職 (例: 院長)" 
                                          value={staff.jobTitle}
                                          onChange={(e) => updateStaffInfo(idx, 'jobTitle', e.target.value)}
                                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white text-slate-900"
                                        />
                                     </div>
                                     <div>
                                        <input 
                                          type="text" 
                                          placeholder="名前 (例: 山田 太郎)" 
                                          value={staff.name}
                                          onChange={(e) => updateStaffInfo(idx, 'name', e.target.value)}
                                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white text-slate-900"
                                        />
                                     </div>
                                </div>
                            </div>
                        ))}
                        <button 
                             onClick={() => staffInputRef.current?.click()}
                             className="w-full py-2 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-sm flex items-center justify-center"
                        >
                             <ImagePlus className="w-4 h-4 mr-2" />
                             人物写真を追加
                        </button>
                        <input ref={staffInputRef} type="file" className="hidden" accept="image/*" onChange={handleStaffUpload} />
                    </div>
                </div>

                {/* 3.2 Landscape / Equipment */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center text-sm">
                        <Camera className="w-4 h-4 mr-2" />
                        風景・機材写真
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                        {landscapeImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square bg-white rounded border border-slate-200 overflow-hidden">
                                <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                                <button onClick={() => removeLandscape(idx)} className="absolute top-0 right-0 bg-white/80 p-0.5 text-red-500"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                        <button 
                             onClick={() => landscapeInputRef.current?.click()}
                             className="aspect-square border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-slate-50"
                        >
                             <ImagePlus className="w-5 h-5" />
                        </button>
                        <input ref={landscapeInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleLandscapeUpload} />
                    </div>
                </div>
            </div>
          </div>

          {/* Step 4: Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-2">4</span>
              フッター情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">メイン (医院名・セミナー名) *</label>
                <input
                  type="text"
                  value={mainInfo}
                  onChange={(e) => setMainInfo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  placeholder="例: 栗林歯科医院"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><Phone className="w-3 h-3 mr-1"/> TEL</label>
                <input
                  type="text"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  placeholder="03-1234-5678"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1"/> サブ (住所・開催場所)</label>
                <input
                  type="text"
                  value={subInfo}
                  onChange={(e) => setSubInfo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  placeholder="東京都千代田区丸の内..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><CalendarClock className="w-3 h-3 mr-1"/> サブ2 (日時)</label>
                <input
                  type="text"
                  value={subInfo2}
                  onChange={(e) => setSubInfo2(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  placeholder="例: 2024年11月24日(日) 10:00~"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center"><Globe className="w-3 h-3 mr-1"/> URL (QRコード用)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Step 5: Design */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center mr-2">5</span>
              補足情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-slate-500 mb-1">その他記載する補足情報（任意）</label>
                 <textarea
                   value={subjectDesc}
                   onChange={(e) => setSubjectDesc(e.target.value)}
                   className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none h-20 bg-white text-slate-900"
                   placeholder="例：初心者の方にも丁寧に教えます"
                 />
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">構図</label>
                  <select value={composition} onChange={(e) => setComposition(e.target.value as FlyerComposition)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900">
                     <option value="Rule of thirds">三分割法 (バランス重視)</option>
                     <option value="Negative space">余白重視 (高級感・モダン)</option>
                     <option value="Center">日の丸構図 (インパクト)</option>
                     <option value="Symmetrical">左右対称 (安定感)</option>
                     <option value="Diagonal">対角線構図 (動き・リズム)</option>
                  </select>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">雰囲気</label>
                  <select value={mood} onChange={(e) => setMood(e.target.value as FlyerMood)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900">
                     <option value="Clean">清潔感 (Clean)</option>
                     <option value="Trustworthy">信頼感 (Trustworthy)</option>
                     <option value="Warm">温かみ (Warm)</option>
                     <option value="Professional">プロフェッショナル</option>
                     <option value="Luxury">高級感 (Luxury)</option>
                     <option value="Friendly">親しみやすさ (Friendly)</option>
                  </select>
               </div>

               <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">配色</label>
                  <select value={colorScheme} onChange={(e) => setColorScheme(e.target.value as FlyerColorScheme)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900">
                     <option value="Blue and White">青と白 (歯科の王道)</option>
                     <option value="Pastel">パステル (小児・優しい)</option>
                     <option value="Gold and White">ゴールド＆白 (審美・高級)</option>
                     <option value="Green and Natural">緑とナチュラル (予防・安心)</option>
                     <option value="Monochrome">モノクローム (スタイリッシュ)</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
           <button
             onClick={handleGenerate}
             disabled={isProcessing}
             className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg flex items-center disabled:opacity-50 transition-all active:scale-95"
           >
             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'チラシを生成 (3案)'}
           </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">生成結果</h3>
                <button 
                  onClick={handleGenerate} 
                  disabled={isProcessing} 
                  className="flex items-center text-slate-600 hover:text-indigo-600 bg-slate-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  全件再生成
                </button>
             </div>
             
             <div className="space-y-12">
                {results.map((result, groupIdx) => (
                    <div key={groupIdx}>
                        <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2 flex items-center">
                            <span className="w-2 h-6 bg-indigo-500 rounded mr-2"></span>
                            {result.ratio} サイズ
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {result.images.map((img, idx) => (
                            <div key={idx} className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className={`relative ${getAspectClass(result.ratio)} bg-slate-200 rounded-lg overflow-hidden mb-3`}>
                                    <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" />
                                </div>
                                <button 
                                    onClick={() => downloadImage(img, `flyer-${result.ratio.replace(':','-')}-${idx + 1}.png`)}
                                    className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm"
                                >
                                    <Download className="w-4 h-4 mr-2" /> 保存
                                </button>
                            </div>
                            ))}
                        </div>
                    </div>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};

export default FlyerGenerator;
