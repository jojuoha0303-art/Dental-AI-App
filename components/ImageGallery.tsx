
import React, { useState, useEffect } from 'react';
import { SlideImageResult, SlideSection, GeneratedSummaries, GenerationMode } from '../types';
import { RefreshCcw, X, Presentation, Download, Square, Monitor, FileText, Share2, Clipboard, Check } from 'lucide-react';
// @ts-ignore
import PptxGenJS from 'pptxgenjs';

interface ImageGalleryProps {
  results: SlideImageResult[];
  summaries: GeneratedSummaries | null;
  onReset: () => void;
  initialMode: GenerationMode;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ results, summaries, onReset, initialMode }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
  const [activeTab, setActiveTab] = useState<'blog' | 'sns'>('blog');
  const [copied, setCopied] = useState<string | null>(null);

  // Set initial tab based on selection
  useEffect(() => {
    if (initialMode === 'SNS') {
      setActiveTab('sns');
    } else {
      setActiveTab('blog');
    }
  }, [initialMode]);

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadPPT = async () => {
    setIsGeneratingPPT(true);
    try {
      const pres = new PptxGenJS();
      
      // Configure presentation
      pres.layout = 'LAYOUT_16x9';
      pres.title = 'Generated Presentation';

      // Define sections and their display order/labels
      // Flow: Cover -> MangaBefore -> Objective -> Methods -> Results -> Conclusion -> Summary -> MangaAfter
      const sectionsOrder: { key: SlideSection; label: string }[] = [
        { key: 'Cover', label: '表紙' },
        { key: 'MangaBefore', label: 'あるある（研究前）' },
        { key: 'Objective', label: '目的・背景' },
        { key: 'Methods', label: '方法' },
        { key: 'Results', label: '結果' },
        { key: 'Conclusion', label: '結論' },
        { key: 'Summary', label: '要約・ポイント' },
        { key: 'MangaAfter', label: '患者さんへの説明' }
      ];

      // Create image slides
      for (const sectionInfo of sectionsOrder) {
        const result = results.find(r => r.section === sectionInfo.key);
        // Use 16:9 image for PPT by default, fallback to 1:1 if 16:9 is missing
        const imageBase64 = result?.image16x9 || result?.image1x1;
        if (!imageBase64) continue;

        const slide = pres.addSlide();

        // 1. Add the generated image
        if (sectionInfo.key === 'Cover') {
           // For cover, fill the whole slide
           slide.addImage({
            data: `data:image/png;base64,${imageBase64}`,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'contain', w: '100%', h: '100%' } // use contain for mixed aspect ratios
          });
        } else {
           // For content, position centered vertically since nav is removed
           // Slide height is 5.625 inches (16:9 layout)
           // Image height is 4.5 inches
           // (5.625 - 4.5) / 2 = 0.5625
           slide.addImage({
            data: `data:image/png;base64,${imageBase64}`,
            x: 0.5,
            y: 0.56,
            w: 9,
            h: 4.5,
            sizing: { type: 'contain', w: 9, h: 4.5 }
          });
          
          // Add small label for section name
          slide.addText(sectionInfo.label, {
            x: 0.5,
            y: 0.2,
            fontSize: 12,
            color: '666666'
          });
        }
      }

      // Add SNS Post Slide
      if (summaries && summaries.snsPost) {
        const slide = pres.addSlide();
        
        slide.addText("SNS投稿用ドラフト", {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 0.5,
          fontSize: 24,
          bold: true,
          color: '333333'
        });

        slide.addText(summaries.snsPost, {
          x: 0.5,
          y: 1.2,
          w: '90%',
          h: 4.0,
          fontSize: 14,
          color: '555555',
          wrap: true
        });
      }

      // Save file
      await pres.writeFile({ fileName: 'Presentation-SlideGen.pptx' });
    } catch (error) {
      console.error("PPT Generation failed", error);
      alert("ファイルの生成に失敗しました。");
    } finally {
      setIsGeneratingPPT(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">生成結果</h2>
          <p className="text-slate-600 mt-1">
            表紙と各セクションのスライド (16:9 / 1:1) を生成しました。
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onReset}
            className="flex items-center px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            最初から
          </button>
          <button 
            onClick={handleDownloadPPT}
            disabled={isGeneratingPPT}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Presentation className="w-4 h-4 mr-2" />
            {isGeneratingPPT ? '作成中...' : 'Googleスライド形式 (.pptx)'}
          </button>
        </div>
      </div>

      <div className="space-y-12 mb-16">
        {results.map((result) => (
          <div key={result.section} className="border-t border-slate-200 pt-8 first:border-0 first:pt-0">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-2 h-8 bg-indigo-600 rounded mr-3"></span>
              {result.section === 'Cover' ? '表紙 (タイトル)' : 
               result.section === 'MangaBefore' ? '漫画：あるある（研究前）' :
               result.section === 'MangaAfter' ? '漫画：患者さんへの説明' :
               result.section === 'Summary' ? '要約・インフォグラフィック' :
               result.section}
            </h3>
            
            <div className={`grid grid-cols-1 ${result.image16x9 ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-lg mx-auto'} gap-6`}>
              
              {/* 16:9 Landscape Card - Only show if data exists */}
              {result.image16x9 && (
                <div className="flex flex-col">
                   <div className="flex items-center justify-between mb-2 text-sm text-slate-500 font-medium">
                      <div className="flex items-center">
                          <Monitor className="w-4 h-4 mr-2" />
                          スライド用 (16:9)
                      </div>
                      <button 
                          onClick={() => downloadImage(result.image16x9, `${result.section}-16x9.png`)}
                          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors p-1 hover:bg-indigo-50 rounded"
                          title="画像をダウンロード"
                      >
                          <Download className="w-4 h-4 mr-1" />
                          保存
                      </button>
                   </div>
                   <div className="relative w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 group">
                     <div className="relative pt-[56.25%] bg-slate-100">
                        <img 
                          src={`data:image/png;base64,${result.image16x9}`} 
                          alt={`${result.section} 16:9 slide`}
                          className="absolute top-0 left-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setPreviewImage(result.image16x9)}
                        />
                     </div>
                   </div>
                   {/* Variants for Cover if present */}
                   {result.variants && (
                       <div className="mt-4 grid grid-cols-4 gap-2">
                           {Object.entries(result.variants).map(([style, images]: [string, any]) => (
                               images.image16x9 ? (
                                   <div key={style} className="cursor-pointer group" onClick={() => downloadImage(images.image16x9, `Cover-${style}-16x9.png`)}>
                                       <p className="text-xs text-center mb-1 text-slate-500">{style}</p>
                                       <div className="aspect-video bg-slate-100 rounded border border-slate-200 overflow-hidden">
                                            <img src={`data:image/png;base64,${images.image16x9}`} className="w-full h-full object-cover" />
                                       </div>
                                   </div>
                               ) : null
                           ))}
                       </div>
                   )}
                </div>
              )}

              {/* 1:1 Square Card */}
              <div className="flex flex-col">
                 <div className="flex items-center justify-between mb-2 text-sm text-slate-500 font-medium">
                    <div className="flex items-center">
                        <Square className="w-4 h-4 mr-2" />
                        SNS・資料用 (1:1)
                    </div>
                    <button 
                        onClick={() => downloadImage(result.image1x1, `${result.section}-1x1.png`)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors p-1 hover:bg-indigo-50 rounded"
                        title="画像をダウンロード"
                    >
                        <Download className="w-4 h-4 mr-1" />
                        保存
                    </button>
                 </div>
                 <div className="relative w-full bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 group">
                    {/* Maintain aspect ratio 1:1 */}
                   <div className="relative w-full pt-[100%] bg-slate-100">
                      <img 
                        src={`data:image/png;base64,${result.image1x1}`} 
                        alt={`${result.section} 1:1 slide`}
                        className="absolute top-0 left-0 w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setPreviewImage(result.image1x1)}
                      />
                   </div>
                 </div>
                  {/* Variants for Cover if present (1:1) */}
                  {result.variants && (
                       <div className="mt-4 grid grid-cols-4 gap-2">
                           {Object.entries(result.variants).map(([style, images]: [string, any]) => (
                               images.image1x1 ? (
                                   <div key={style} className="cursor-pointer group" onClick={() => downloadImage(images.image1x1, `Cover-${style}-1x1.png`)}>
                                       <p className="text-xs text-center mb-1 text-slate-500">{style}</p>
                                       <div className="aspect-square bg-slate-100 rounded border border-slate-200 overflow-hidden">
                                            <img src={`data:image/png;base64,${images.image1x1}`} className="w-full h-full object-cover" />
                                       </div>
                                   </div>
                               ) : null
                           ))}
                       </div>
                   )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Generated Summaries Section */}
      {summaries && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="border-b border-slate-200 flex">
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex-1 py-4 text-center font-bold text-sm sm:text-base flex items-center justify-center transition-colors ${
                activeTab === 'blog'
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              患者向け解説ブログ
            </button>
            <button
              onClick={() => setActiveTab('sns')}
              className={`flex-1 py-4 text-center font-bold text-sm sm:text-base flex items-center justify-center transition-colors ${
                activeTab === 'sns'
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-700'
              }`}
            >
              <Share2 className="w-4 h-4 mr-2" />
              SNS投稿ドラフト
            </button>
          </div>
          
          <div className="p-6 relative">
            <div className="absolute top-6 right-6 z-10">
               <button
                 onClick={() => copyToClipboard(activeTab === 'blog' ? summaries.blogPost : summaries.snsPost, activeTab)}
                 className="flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
               >
                 {copied === activeTab ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Clipboard className="w-4 h-4 mr-2" />}
                 {copied === activeTab ? 'コピーしました' : 'テキストをコピー'}
               </button>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-6 font-mono text-sm leading-relaxed text-slate-800 border border-slate-100 min-h-[300px] whitespace-pre-wrap">
              {activeTab === 'blog' ? summaries.blogPost : summaries.snsPost}
            </div>
            
            <div className="mt-4 text-right text-xs text-slate-400">
              {activeTab === 'blog' ? '想定文字数: 3000-6000文字' : '想定文字数: 約800文字'}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={`data:image/png;base64,${previewImage}`} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ImageGallery;