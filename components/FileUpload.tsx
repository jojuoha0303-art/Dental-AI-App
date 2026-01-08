
import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, Image as ImageIcon, Type, Files } from 'lucide-react';
import { AnalysisInput, InputFile } from '../types';

interface FileUploadProps {
  onInputSubmit: (input: AnalysisInput) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onInputSubmit, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState("");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFiles = async (fileList: FileList) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    // Filter valid types
    const validFiles = filesArray.filter(f => 
      ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.type)
    );
    
    if (validFiles.length === 0) {
      alert("対応ファイル: PDF, PNG, JPG, WEBP のみです。");
      return;
    }

    // Update UI immediately
    setSelectedFiles(validFiles);

    // Read all files
    const readPromises = validFiles.map(file => new Promise<InputFile>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        resolve({ mimeType: file.type, data: base64 });
      };
      reader.readAsDataURL(file);
    }));

    const inputFiles = await Promise.all(readPromises);
    
    // Determine type: if any PDF, treat as pdf (singular conceptually), otherwise images
    const hasPdf = validFiles.some(f => f.type === 'application/pdf');
    const type = hasPdf ? 'pdf' : 'images';

    onInputSubmit({
      type,
      files: inputFiles
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [onInputSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    onInputSubmit({
      type: 'text',
      text: textInput
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      {/* Tabs */}
      <div className="flex mb-4 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('file')}
          disabled={isProcessing}
          className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold transition-all ${
            activeTab === 'file' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload className="w-4 h-4 mr-2" />
          ファイル (PDF/画像)
        </button>
        <button
          onClick={() => setActiveTab('text')}
          disabled={isProcessing}
          className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-bold transition-all ${
            activeTab === 'text' 
              ? 'bg-indigo-100 text-indigo-700' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Type className="w-4 h-4 mr-2" />
          テキスト入力
        </button>
      </div>

      {activeTab === 'file' ? (
        <div
          className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl transition-all duration-300 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 bg-white hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 mb-4 text-indigo-600 animate-spin" />
                <p className="text-lg font-medium text-slate-700">解析中...</p>
                <p className="text-sm text-slate-500 mt-2">
                  論文・画像の内容を読み取っています
                </p>
              </>
            ) : selectedFiles.length > 0 ? (
              <>
                {selectedFiles.some(f => f.type === 'application/pdf') ? (
                  <FileText className="w-12 h-12 mb-4 text-indigo-600" />
                ) : (
                  <Files className="w-12 h-12 mb-4 text-indigo-600" />
                )}
                <p className="text-lg font-medium text-slate-900">
                  {selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length}個のファイルを選択中`}
                </p>
                <p className="text-sm text-green-600 mt-2 font-semibold">解析中...</p>
              </>
            ) : (
              <>
                <div className="flex gap-4 mb-4">
                  <Upload className="w-10 h-10 text-slate-400" />
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                </div>
                <p className="mb-2 text-lg font-medium text-slate-700">
                  PDFまたは画像をドラッグ＆ドロップ
                </p>
                <p className="text-sm text-slate-500">
                  複数画像の選択も可能です (.pdf, .png, .jpg)
                </p>
              </>
            )}
          </div>
          <input
            id="dropzone-file"
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleChange}
            disabled={isProcessing}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-300 p-4 shadow-sm">
           <textarea
             className="w-full h-56 p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-700"
             placeholder="論文の要約やテキストをここに貼り付けてください..."
             value={textInput}
             onChange={(e) => setTextInput(e.target.value)}
             disabled={isProcessing}
           />
           <div className="mt-4 flex justify-end">
              <button
                onClick={handleTextSubmit}
                disabled={isProcessing || !textInput.trim()}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                解析を開始
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
