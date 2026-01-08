
import React, { useRef } from 'react';
import { SlideDraft, MangaStyle, SNSCoverStyle } from '../types';
import { FileText, User, Edit3, ImagePlus, X, RefreshCw, Palette, Star } from 'lucide-react';

interface TextSelectorProps {
  drafts: SlideDraft[];
  onConfirm: () => void;
  onDraftUpdate: (index: number, field: keyof SlideDraft, value: string) => void;
  isGenerating: boolean;
  authorImage: string | null;
  onAuthorImageChange: (base64: string | null) => void;
  mangaStyle: MangaStyle;
  onMangaStyleChange: (style: MangaStyle) => void;
  onRegenerateText: (index: number) => void;
  isRegeneratingText: boolean;
  
  // SNS Cover specific
  snsCoverStyle?: SNSCoverStyle;
  onSnsCoverStyleChange?: (style: SNSCoverStyle) => void;
}

const TextSelector: React.FC<TextSelectorProps> = ({ 
  drafts, 
  onConfirm, 
  onDraftUpdate, 
  isGenerating,
  authorImage,
  onAuthorImageChange,
  mangaStyle,
  onMangaStyleChange,
  onRegenerateText,
  isRegeneratingText,
  snsCoverStyle,
  onSnsCoverStyleChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Get Base64 part
        const base64 = result.split(',')[1];
        onAuthorImageChange(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-24">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900">スライド構成の確認・編集</h2>
        <p className="text-slate-600 mt-2">
          画像生成前に、スライドのタイトルや内容を編集できます。
        </p>
      </div>

      {/* Manga Style Selector */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="flex items-center mb-4">
          <Palette className="w-6 h-6 text-pink-500 mr-2" />
          <h3 className="text-lg font-bold text-slate-900">漫画イラストのスタイル選択</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['Shonen', 'Shojo', 'Gekiga', 'Pop'] as MangaStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => onMangaStyleChange(style)}
              className={`p-3 rounded-lg border-2 font-bold transition-all ${
                mangaStyle === style 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'
              }`}
            >
              {style === 'Shonen' && '少年マンガ風'}
              {style === 'Shojo' && '少女マンガ風'}
              {style === 'Gekiga' && '劇画風'}
              {style === 'Pop' && 'アメコミ風'}
            </button>
          ))}
        </div>
      </div>

      {/* SNS Cover Style Selector - Only visible if props provided */}
      {snsCoverStyle && onSnsCoverStyleChange && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-md border border-slate-200">
           <div className="flex items-center mb-4">
             <Star className="w-6 h-6 text-yellow-500 mr-2" />
             <h3 className="text-lg font-bold text-slate-900">SNS投稿カバー画像のテイスト選択</h3>
           </div>
           <p className="text-sm text-slate-500 mb-4">
             保存したくなる、シェアしたくなる、ターゲットに響くデザインを選んでください。
           </p>
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
             {[
               { id: 'Trust/Business', label: '信頼・ビジネス系', desc: '知的で落ち着いた' },
               { id: 'Women/Soft', label: '女性・柔らか系', desc: '上品でナチュラル' },
               { id: 'Casual/Friendly', label: 'カジュアル・親しみ系', desc: '温かく近づきやすい' },
               { id: 'Healing/Relaxing', label: '癒し・リラックス系', desc: 'ほっこり優しい' },
               { id: 'Impact/Attention', label: 'インパクト・注目系', desc: '目を引くデザイン' },
             ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onSnsCoverStyleChange(style.id as SNSCoverStyle)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    snsCoverStyle === style.id
                      ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-200'
                      : 'border-slate-200 bg-white hover:border-pink-300 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{style.label}</div>
                  <div className="text-xs opacity-75">{style.desc}</div>
                </button>
             ))}
           </div>
        </div>
      )}

      <div className="space-y-8">
        {drafts.map((draft, index) => {
          const isCover = draft.section === 'Cover';
          const isManga = draft.section === 'MangaBefore' || draft.section === 'MangaAfter';
          
          return (
            <div key={draft.section} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${isCover ? 'bg-purple-50' : 'bg-slate-50'}`}>
                <div className="flex items-center flex-1">
                  <div className={`p-2 rounded-lg mr-4 ${isCover ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 mr-4">
                    <label className="text-xs text-slate-500 font-bold block mb-1">セクションタイトル (編集可)</label>
                    <input 
                      type="text"
                      value={draft.sectionTitleJP}
                      onChange={(e) => onDraftUpdate(index, 'sectionTitleJP', e.target.value)}
                      className="font-bold text-lg text-slate-900 bg-transparent border-b border-slate-300 focus:border-indigo-500 focus:outline-none w-full py-1 hover:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
                {isCover && <span className="text-xs font-bold bg-purple-200 text-purple-800 px-3 py-1 rounded-full whitespace-nowrap ml-2">表紙</span>}
                {isManga && <span className="text-xs font-bold bg-pink-100 text-pink-600 px-3 py-1 rounded-full whitespace-nowrap ml-2">漫画パート</span>}
              </div>
              
              {/* Content Editor */}
              <div className="p-6 bg-white">
                 <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center">
                            <Edit3 className="w-4 h-4 mr-2 text-indigo-500" />
                            {isCover ? 'タイトル (編集可)' : 'スライド内容 (編集可)'}
                        </label>
                        {isManga && (
                             <button 
                                onClick={() => onRegenerateText(index)}
                                disabled={isRegeneratingText}
                                className="flex items-center text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors disabled:opacity-50"
                             >
                                <RefreshCw className={`w-3 h-3 mr-1.5 ${isRegeneratingText ? 'animate-spin' : ''}`} />
                                内容を再生成
                             </button>
                        )}
                    </div>
                    <textarea
                      value={draft.content}
                      onChange={(e) => onDraftUpdate(index, 'content', e.target.value)}
                      className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900 text-lg leading-relaxed bg-white resize-y transition-shadow"
                      rows={isCover ? 2 : 6}
                      placeholder="スライドの内容を入力してください"
                    />
                 </div>

                 {/* Extra Options for Cover */}
                 {isCover && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Citation Editor */}
                     <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                       <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                          <User className="w-4 h-4 mr-2 text-indigo-500" />
                          著者・年数 (表紙にのみ表示)
                       </label>
                       <input
                         type="text"
                         value={draft.citation || ''}
                         onChange={(e) => onDraftUpdate(index, 'citation', e.target.value)}
                         className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-900 bg-white"
                         placeholder="例: Tanaka 2024"
                       />
                     </div>

                     {/* Author Image Upload */}
                     <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                       <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                          <ImagePlus className="w-4 h-4 mr-2 text-indigo-500" />
                          著者の画像 (任意)
                       </label>
                       
                       {!authorImage ? (
                         <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg bg-white hover:bg-slate-50 hover:border-indigo-400 transition-colors text-slate-500 text-sm font-medium flex items-center justify-center h-[50px]"
                         >
                           クリックして写真をアップロード
                         </button>
                       ) : (
                         <div className="relative flex items-center p-2 bg-white border border-slate-200 rounded-lg">
                           <img 
                             src={`data:image/png;base64,${authorImage}`} 
                             alt="Author" 
                             className="w-10 h-10 rounded object-cover border border-slate-200 mr-3"
                           />
                           <span className="text-sm font-medium text-green-600 flex-1">画像設定済み</span>
                           <button 
                             onClick={() => onAuthorImageChange(null)}
                             className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                       )}
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         className="hidden" 
                         accept="image/*"
                         onChange={handleImageUpload}
                       />
                       <p className="text-xs text-slate-400 mt-2">
                         ※アップロードすると表紙の右下に配置されます
                       </p>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 p-4 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex justify-end items-center">
           <button
            onClick={onConfirm}
            disabled={isGenerating}
            className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center ${
              !isGenerating
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
           >
             {isGenerating ? (
               <>
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></span>
                 画像生成中...
               </>
             ) : (
               '画像を生成する'
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default TextSelector;
