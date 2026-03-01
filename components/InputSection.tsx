
import React, { useRef, useState } from 'react';
import { Camera, Mic, Image as ImageIcon, X, StopCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Language } from '../types';

interface InputSectionProps {
  onSolve: (text: string, image: File | null, audio: Blob | null) => void;
  isLoading: boolean;
  language: Language;
}

export const InputSection: React.FC<InputSectionProps> = ({ onSolve, isLoading, language }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, audioBlob, startRecording, stopRecording, clearAudio } = useAudioRecorder();
  const [isFocused, setIsFocused] = useState(false);

  const isUrdu = language === 'ur';
  const placeholder = isUrdu 
    ? "اپنا سوال یہاں لکھیں، یا آواز/کیمرہ استعمال کریں..." 
    : "Type your question here, or use voice/camera...";
  
  const solveText = isUrdu ? "حل کریں" : "Solve";
  const solvingText = isUrdu ? "...حل ہو رہا ہے" : "Solving...";
  const recordingText = isUrdu ? "رکارڈنگ ہو رہی ہے" : "Recording...";
  const imageAttachedText = isUrdu ? "تصویر منسلک ہے" : "Image Attached";
  const audioAttachedText = isUrdu ? "آواز ریکارڈ ہو گئی" : "Voice Recording Attached";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !selectedImage && !audioBlob) return;
    onSolve(text, selectedImage, audioBlob);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent focusing if clicking on buttons/controls
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    textareaRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto group">
      {/* Restored Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      
      <div 
        dir={isUrdu ? 'rtl' : 'ltr'}
        className={`
        relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 w-full transition-all duration-300 cursor-text
        border border-slate-200/50 shadow-xl
        ${isFocused ? 'ring-2 ring-indigo-500/20' : ''}
      `}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Text Input */}
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full p-2 text-lg bg-transparent border-0 focus:ring-0 text-slate-800 placeholder-slate-400 resize-none leading-relaxed selection:bg-indigo-100 ${isUrdu ? 'font-[sans-serif]' : ''}`}
              style={{ minHeight: '120px' }}
              disabled={isLoading}
            />
          </div>

          {/* Attachments Preview */}
          {(selectedImage || audioBlob) && (
              <div className="flex flex-wrap gap-3 animate-fade-in-up py-3 border-t border-slate-100/50">
                  {selectedImage && (
                      <div className="relative group inline-block">
                          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <div className="p-1 bg-white rounded shadow-sm">
                                <ImageIcon size={16} className="text-slate-600"/>
                              </div>
                              <span className="text-sm text-slate-700 truncate max-w-[150px] font-medium">
                                {selectedImage.name || imageAttachedText}
                              </span>
                          </div>
                          <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); removeImage(); }}
                              className={`absolute -top-2 bg-white text-slate-500 border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 hover:text-red-500 transition-all ${isUrdu ? '-left-2' : '-right-2'}`}
                          >
                              <X size={12} />
                          </button>
                      </div>
                  )}
                  {audioBlob && (
                      <div className="relative group inline-block">
                          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <div className="p-1 bg-white rounded shadow-sm animate-pulse">
                                <Mic size={16} className="text-red-500"/>
                              </div>
                              <span className="text-sm text-slate-700 font-medium">{audioAttachedText}</span>
                          </div>
                          <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); clearAudio(); }}
                              className={`absolute -top-2 bg-white text-slate-500 border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 hover:text-red-500 transition-all ${isUrdu ? '-left-2' : '-right-2'}`}
                          >
                              <X size={12} />
                          </button>
                      </div>
                  )}
              </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center space-x-2">
              
              {/* Image Upload Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                title={isUrdu ? "تصویر اپ لوڈ کریں" : "Upload Image"}
                disabled={isLoading}
              >
                <Camera size={22} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </button>

              {/* Voice Record Button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); isRecording ? stopRecording() : startRecording(); }}
                className={`p-2.5 rounded-xl transition-all duration-300 flex items-center space-x-2 ${
                  isRecording 
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-100 animate-pulse' 
                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                }`}
                title={isRecording ? (isUrdu ? "ریکارڈنگ روکیں" : "Stop Recording") : (isUrdu ? "آواز ریکارڈ کریں" : "Record Voice")}
                disabled={isLoading}
              >
                <div className="relative z-10">
                    {isRecording ? <StopCircle size={22} /> : <Mic size={22} />}
                </div>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              onClick={(e) => e.stopPropagation()}
              disabled={isLoading || (!text && !selectedImage && !audioBlob)}
              className={`
                flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all duration-300 shadow-lg shadow-indigo-200
                ${isLoading || (!text && !selectedImage && !audioBlob)
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-300 hover:-translate-y-0.5'
                }
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{solvingText}</span>
                </>
              ) : (
                <>
                  <span className={`${isUrdu ? 'ml-2' : ''} hidden sm:inline`}>{solveText}</span>
                  {(!text && !selectedImage && !audioBlob) ? <Sparkles size={16} /> : (isUrdu ? <ArrowRight size={18} className="transform rotate-180" /> : <ArrowRight size={18} />)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
