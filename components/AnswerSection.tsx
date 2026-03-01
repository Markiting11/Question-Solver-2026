
import React, { useState, useRef, useEffect } from 'react';
import { SolutionResponse, AnswerMode, Language } from '../types';
import { MermaidDiagram } from './MermaidDiagram';
import { BookOpen, List, Image as ImageIcon, Zap, FileText, Download, PenTool, Layers, Grid, ZoomIn, ZoomOut, RotateCcw, Save, Copy, Check, Feather, Notebook, FileImage, FileDown, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

declare global {
  interface Window {
    html2pdf: any;
    html2canvas: any;
  }
}

interface AnswerSectionProps {
  solution: SolutionResponse;
  language: Language;
}

export const AnswerSection: React.FC<AnswerSectionProps> = ({ solution, language }) => {
  const [activeTab, setActiveTab] = useState<AnswerMode>(AnswerMode.SIMPLE);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null); // Track which menu is open
  const isUrdu = language === 'ur';
  
  // Visual Section State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const visualContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveDownloadMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Translations
  const t = {
    simple: { en: 'Simple', ur: 'آسان' },
    steps: { en: 'Steps', ur: 'مراحل' },
    studyNotes: { en: 'Study Notes', ur: 'اسٹڈی نوٹس' },
    easyNotes: { en: 'Easy Notes', ur: 'آسان نوٹس' },
    visual: { en: 'Visual', ur: 'تصویر' },
    short: { en: 'Short', ur: 'مختصر' },
    detailed: { en: 'Detailed', ur: 'تفصیلی' },
    simpleTitle: { en: 'Simple Explanation', ur: 'آسان وضاحت' },
    stepsTitle: { en: 'Step-by-Step Breakdown', ur: 'مرحلہ وار تفصیل' },
    studyNotesTitle: { en: 'Student Notebook (Formal)', ur: 'طالب علم نوٹ بک' },
    easyNotesTitle: { en: 'Simplified Easy Notes', ur: 'بچوں کے لیے آسان نوٹس' },
    visualTitle: { en: 'Visual Explanation', ur: 'بصری وضاحت' },
    shortTitle: { en: 'Quick Summary', ur: 'فوری خلاصہ' },
    detailedTitle: { en: 'Detailed Analysis', ur: 'تفصیلی تجزیہ' },
    savePdf: { en: 'Download Full Answer PDF', ur: 'پورا جواب PDF ڈاؤن لوڈ کریں' },
    generating: { en: 'Generating...', ur: 'بن رہا ہے...' },
    downloadOptions: { en: 'Download', ur: 'ڈاؤن لوڈ' },
    downloadJpg: { en: 'Download JPG', ur: 'JPG ڈاؤن لوڈ' },
    downloadPdf: { en: 'Download PDF', ur: 'PDF ڈاؤن لوڈ' },
    systemDiagram: { en: 'System Diagram', ur: 'سیسم ڈایاگرام' },
    aiGenerated: { en: 'AI Generated Visualization', ur: 'AI کی تیار کردہ تصویر' },
    diagramHelp: { en: 'Pan to explore. Diagrams are automatically generated.', ur: 'تصویر کو گھسیٹ کر دیکھیں۔ تصاویر خودکار طور پر بنتی ہیں۔' },
    copy: { en: 'Copy', ur: 'کاپی کریں' },
    copied: { en: 'Copied!', ur: 'کاپی ہو گیا!' }
  };

  const getT = (key: keyof typeof t) => t[key][language];

  const getContent = (field: keyof SolutionResponse) => {
    const data = solution[field] as any;
    if (typeof data === 'string') return data;
    return data[language] || data['en'];
  };

  // --- Actions ---

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Generic Download Function
  const handleSectionDownload = async (format: 'jpg' | 'pdf', elementId: string, sectionTitle: string) => {
    setActiveDownloadMenu(null); // Close menu
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (elementId === 'visual-content-area' && format === 'jpg') {
        handleDownloadVisualJPG();
        return;
    }

    const filename = `${getContent('subject').replace(/\s+/g, '_')}_${sectionTitle.replace(/\s+/g, '_')}`;

    if (format === 'pdf') {
        if (window.html2pdf) {
            const opt = {
                margin: 10, // 10mm margins for A4
                filename: `${filename}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                  scale: 3, 
                  useCORS: true, 
                  letterRendering: true,
                  backgroundColor: '#ffffff'
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            try {
                await window.html2pdf().set(opt).from(element).save();
            } catch (e) {
                console.error("PDF generation failed", e);
                alert("Could not generate PDF.");
            }
        }
    } else {
        if (window.html2canvas) {
             try {
                const canvas = await window.html2canvas(element, { 
                    scale: 2, 
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                
                const link = document.createElement('a');
                link.download = `${filename}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.95);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
             } catch (e) {
                 console.error("JPG generation failed", e);
                 alert("Could not generate JPG.");
             }
        } else {
            alert("Image generator not loaded yet.");
        }
    }
  };

  const handleDownloadVisualJPG = () => {
    const svg = visualContainerRef.current?.querySelector('svg');
    if (svg) {
        const scale = 3;
        const svgSize = svg.getBoundingClientRect();
        const width = svgSize.width;
        const height = svgSize.height;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        const serializer = new XMLSerializer();
        let svgData = serializer.serializeToString(svg);
        if (!svgData.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgData = svgData.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try {
                const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
                const link = document.createElement('a');
                link.href = jpgUrl;
                link.download = `${getContent('subject')}_Diagram.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) { console.error(e); }
            URL.revokeObjectURL(url);
        };
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
    }
  };

  const handleFullDownload = async () => {
    setIsGeneratingPdf(true);
    const element = document.getElementById('answer-content-export');
    
    if (element && window.html2pdf) {
      const opt = {
        margin: 10, // 10mm all around
        filename: `${getContent('subject').replace(/\s+/g, '_')}_Full_Solution.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          letterRendering: true, 
          backgroundColor: '#ffffff',
          logging: false 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['h1', 'h2', 'h3', 'blockquote', 'li', '.visual-content-area', '.spiral-binding']
        }
      };
      
      try {
        await window.html2pdf().set(opt).from(element).save();
      } catch (e) {
        console.error("PDF generation failed", e);
        window.print();
      }
    } else {
       window.print();
    }
    setIsGeneratingPdf(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => Math.min(Math.max(direction === 'in' ? prev + 0.25 : prev - 0.25, 0.5), 4));
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  const SectionHeader = ({ title, icon, color, id, textToCopy }: { title: string, icon: React.ReactNode, color: string, id: string, textToCopy?: string }) => {
    const isOpen = activeDownloadMenu === id;
    
    return (
        <div className="flex justify-between items-center mb-4 no-print relative z-20">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <span className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center ${isUrdu ? 'ml-3' : 'mr-3'}`}>
                    {icon}
                </span>
                {title}
            </h3>
            <div className="flex items-center space-x-2" ref={isOpen ? menuRef : null}>
                 {textToCopy && (
                    <button 
                        onClick={() => handleCopy(textToCopy, id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title={getT('copy')}
                    >
                        {copiedSection === id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                 )}
                 <div className="relative">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveDownloadMenu(isOpen ? null : id);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${isOpen ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <span>{getT('downloadOptions')}</span>
                        <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in-up origin-top-right overflow-hidden">
                             <button 
                                onClick={() => handleSectionDownload('jpg', `${id}-content`, title)}
                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
                            >
                                <FileImage size={16} className={`mr-2.5 text-indigo-500 ${isUrdu ? 'ml-2.5 mr-0' : ''}`} />
                                {getT('downloadJpg')}
                            </button>
                            <button 
                                onClick={() => handleSectionDownload('pdf', `${id}-content`, title)}
                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-slate-50 text-left"
                            >
                                <FileDown size={16} className={`mr-2.5 text-red-500 ${isUrdu ? 'ml-2.5 mr-0' : ''}`} />
                                {getT('downloadPdf')}
                            </button>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
  };

  const stepsComponents: any = {
    ol: ({node, ...props}: any) => <ol className="space-y-4 my-6 list-none p-0" {...props} />,
    ul: ({node, ...props}: any) => <ul className={`space-y-3 my-4 list-disc ${isUrdu ? 'pr-5' : 'pl-5'}`} {...props} />,
    li: ({node, ...props}: any) => (
        <li className="relative bg-white/50 p-5 rounded-xl border border-emerald-100/50 shadow-sm transition-all text-lg leading-relaxed text-slate-700">
            {props.children}
        </li>
    ),
    h3: ({node, ...props}: any) => <h3 className="text-xl font-bold text-slate-800 mb-3 mt-1" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-slate-900 bg-emerald-50 px-1.5 py-0.5 rounded-md text-emerald-800" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
  };

  const studyNotesComponents: any = {
    p: ({node, ...props}: any) => (
      <p className="mb-10 text-[#1e40af] text-[22px] font-medium leading-[40px] font-handwriting tracking-wide" {...props} />
    ),
    strong: ({node, ...props}: any) => (
      <strong className="text-[#dc2626] font-bold text-[24px] font-handwriting" {...props} />
    ),
    ul: ({node, ...props}: any) => (
      <ul className={`list-none mb-0 ${isUrdu ? 'pr-2' : 'pl-2'}`} {...props} />
    ),
    ol: ({node, ...props}: any) => (
      <ol className={`list-none mb-0 ${isUrdu ? 'pr-2' : 'pl-2'}`} {...props} />
    ),
    li: ({node, ...props}: any) => (
      <li className="text-[#1e40af] text-[22px] leading-[40px] font-handwriting mb-10" {...props} />
    ),
    h1: ({node, ...props}: any) => (
       <h1 className="text-3xl font-bold text-[#dc2626] font-handwriting mb-10 leading-[40px] underline decoration-wavy decoration-[#dc2626]/30" {...props} />
    ),
    h2: ({node, ...props}: any) => (
       <h2 className="text-2xl font-bold text-[#dc2626] font-handwriting mb-10 leading-[40px]" {...props} />
    ),
    h3: ({node, ...props}: any) => (
       <h3 className="text-xl font-bold text-[#dc2626] font-handwriting mb-10 leading-[40px] inline-block mr-2" {...props} />
    ),
    code: ({node, ...props}: any) => (
        <code className="text-[#1e40af] bg-transparent font-handwriting text-xl font-bold" {...props} />
    )
  };

  const easyNotesComponents: any = {
    p: ({node, ...props}: any) => (
      <p className="mb-4 text-slate-800 text-[26px] font-medium leading-[42px] font-easy-notes" {...props} />
    ),
    strong: ({node, ...props}: any) => (
      <strong className="text-indigo-600 font-bold text-[28px] font-easy-notes" {...props} />
    ),
    ul: ({node, ...props}: any) => (
      <ul className={`list-disc mb-4 ${isUrdu ? 'pr-8' : 'pl-8'}`} {...props} />
    ),
    ol: ({node, ...props}: any) => (
      <ol className={`list-decimal mb-4 ${isUrdu ? 'pr-8' : 'pl-8'}`} {...props} />
    ),
    li: ({node, ...props}: any) => (
      <li className="text-slate-800 text-[26px] leading-[42px] font-easy-notes mb-2 pl-2" {...props} />
    ),
    h1: ({node, ...props}: any) => (
       <h1 className="text-4xl font-bold text-indigo-600 font-easy-notes mb-6" {...props} />
    ),
    h2: ({node, ...props}: any) => (
       <h2 className="text-3xl font-bold text-indigo-500 font-easy-notes mb-4 mt-6" {...props} />
    ),
    h3: ({node, ...props}: any) => (
       <h3 className="text-2xl font-bold text-indigo-500 font-easy-notes mb-2 mt-4" {...props} />
    ),
  };

  const detailedComponents: any = {
    h1: ({node, ...props}: any) => (
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8 pb-4 border-b border-slate-100" {...props} />
    ),
    h2: ({node, ...props}: any) => (
        <h2 className="text-2xl font-bold text-slate-800 mt-12 mb-6 flex items-center group" {...props}>
            <span className={`w-1.5 h-8 bg-indigo-600 rounded-full group-hover:scale-110 transition-transform shadow-sm ${isUrdu ? 'ml-4' : 'mr-4'}`}></span>
            {props.children}
        </h2>
    ),
    h3: ({node, ...props}: any) => (
        <h3 className="text-xl font-semibold text-slate-700 mt-8 mb-4 flex items-center" {...props}>
            <span className={`w-2 h-2 rounded-full bg-indigo-300 ${isUrdu ? 'ml-3' : 'mr-3'}`}></span>
            {props.children}
        </h3>
    ),
    p: ({node, ...props}: any) => (
        <p className="text-slate-600 leading-loose mb-6 text-lg tracking-wide" {...props} />
    ),
    ul: ({node, ...props}: any) => (
        <ul className={`space-y-4 mb-8 ${isUrdu ? 'mr-4' : 'ml-4'}`} {...props} />
    ),
    ol: ({node, ...props}: any) => (
        <ol className={`list-decimal space-y-4 mb-8 text-slate-700 font-medium marker:text-indigo-600 marker:font-bold ${isUrdu ? 'mr-8' : 'ml-8'}`} {...props} />
    ),
    li: ({node, ...props}: any) => (
        <li className={`${isUrdu ? 'pr-2' : 'pl-2'} relative text-lg leading-relaxed`} {...props} />
    ),
    blockquote: ({node, ...props}: any) => (
        <div className="relative my-10 group">
            <blockquote className={`relative p-8 bg-indigo-50/50 rounded-lg ${isUrdu ? 'border-r-[6px]' : 'border-l-[6px]'} border-indigo-400 text-indigo-900 shadow-sm overflow-hidden`}>
                <div className={`absolute top-[-10px] ${isUrdu ? 'left-4' : 'right-4'} text-9xl text-indigo-200 opacity-20 font-serif select-none pointer-events-none`}>
                    "
                </div>
                <div className="italic font-medium leading-loose relative z-10 text-lg">
                    {props.children}
                </div>
            </blockquote>
        </div>
    ),
    code: ({node, inline, className, children, ...props}: any) => {
        if (inline) {
            return <code className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-sm border border-indigo-100 font-semibold" dir="ltr" {...props}>{children}</code>;
        }
        return (
            <div className="my-8 rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl bg-[#1e1e1e] group" dir="ltr">
                <pre className="p-6 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed bg-[#1e1e1e]">
                    <code {...props}>{children}</code>
                </pre>
            </div>
        );
    },
    table: ({node, ...props}: any) => (
        <div className="overflow-x-auto my-10 rounded-xl border border-slate-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-slate-200" {...props} />
        </div>
    ),
    thead: ({node, ...props}: any) => <thead className="bg-slate-50" {...props} />,
    th: ({node, ...props}: any) => <th className={`px-6 py-4 text-xs font-bold text-slate-700 uppercase tracking-wider ${isUrdu ? 'text-right' : 'text-left'}`} {...props} />,
    tbody: ({node, ...props}: any) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
    tr: ({node, ...props}: any) => <tr className="hover:bg-slate-50/50 transition-colors" {...props} />,
    td: ({node, ...props}: any) => <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-slate-900 bg-indigo-50 px-1 rounded" {...props} />,
  };

  const renderContent = () => {
    switch (activeTab) {
      case AnswerMode.SIMPLE:
        const simpleText = getContent('simple');
        return (
          <div className="animate-fade-in-up">
            <SectionHeader 
                title={getT('simpleTitle')} 
                icon={<BookOpen size={18} />} 
                color="bg-blue-100 text-blue-600" 
                id="simple"
                textToCopy={simpleText}
            />
            <div id="simple-content" className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl shadow-sm">
              <div className="text-lg text-slate-700 leading-relaxed font-medium">
                {simpleText}
              </div>
            </div>
          </div>
        );
      case AnswerMode.EASY_NOTES:
        const easyNotesText = getContent('easyNotes') || getContent('simple');
        return (
          <div className="w-full animate-fade-in-up">
            <SectionHeader 
                title={getT('easyNotesTitle')} 
                icon={<Feather size={18} />} 
                color="bg-lime-100 text-lime-600" 
                id="easyNotes"
                textToCopy={easyNotesText}
            />
            <div id="easyNotes-content" className={`easy-notes-paper rounded-lg relative ${isUrdu ? 'text-right' : 'text-left'}`}>
               <div className="animate-ink">
                 <ReactMarkdown components={easyNotesComponents}>
                    {easyNotesText}
                 </ReactMarkdown>
              </div>
            </div>
          </div>
        );
      case AnswerMode.HANDWRITTEN:
        const notesText = getContent('handwrittenNotes');
        return (
          <div className="w-full animate-fade-in-up">
            <SectionHeader 
                title={getT('studyNotesTitle')} 
                icon={<Notebook size={18} />} 
                color="bg-amber-100 text-amber-600" 
                id="notes"
                textToCopy={notesText}
            />
            
            <div id="notes-content" className={`spiral-notebook relative ${isUrdu ? 'text-right' : 'text-left'}`}>
              <div className="spiral-binding no-print"></div>
              <div className="animate-ink">
                 <ReactMarkdown components={studyNotesComponents}>
                    {notesText}
                 </ReactMarkdown>
              </div>
            </div>
          </div>
        );
      case AnswerMode.STEP_BY_STEP:
        const stepText = getContent('stepByStep');
        return (
          <div className="animate-fade-in-up">
            <SectionHeader 
                title={getT('stepsTitle')} 
                icon={<List size={18} />} 
                color="bg-emerald-100 text-emerald-600" 
                id="steps"
                textToCopy={stepText}
            />
            <div id="steps-content" className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-6 sm:p-8 rounded-2xl border border-emerald-100/50 shadow-sm">
                <div className="prose prose-slate prose-lg max-w-none">
                    <ReactMarkdown components={stepsComponents}>
                        {stepText}
                    </ReactMarkdown>
                </div>
            </div>
          </div>
        );
      case AnswerMode.VISUAL:
        const visualCode = getContent('visual');
        return (
          <div className="w-full animate-fade-in-up">
             <div className="flex justify-between items-end mb-4 relative z-20">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <span className={`w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center ${isUrdu ? 'ml-3' : 'mr-3'}`}>
                        <ImageIcon size={18} />
                    </span>
                    {getT('visualTitle')}
                </h3>
             </div>
            
            <div id="visual-content" dir="ltr" className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 transition-all duration-300 hover:shadow-md">
                <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 justify-between z-10 relative">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    </div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center">
                        <Layers size={12} className="mr-1.5" />
                        {getT('systemDiagram')}
                    </div>
                    <div className="flex items-center space-x-1 no-print">
                        <button onClick={() => handleZoom('out')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Zoom Out"><ZoomOut size={14} /></button>
                        <span className="text-xs text-slate-400 min-w-[30px] text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => handleZoom('in')} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Zoom In"><ZoomIn size={14} /></button>
                        <button onClick={handleResetZoom} className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Reset View"><RotateCcw size={14} /></button>
                         <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <div className="relative" ref={activeDownloadMenu === 'visual' ? menuRef : null}>
                            <button 
                                onClick={() => setActiveDownloadMenu(activeDownloadMenu === 'visual' ? null : 'visual')}
                                className={`flex items-center space-x-1 p-1.5 rounded transition-colors ${activeDownloadMenu === 'visual' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-indigo-600'}`}
                                title={getT('downloadOptions')}
                            >
                                <Download size={14} />
                                <ChevronDown size={12} />
                            </button>
                            {activeDownloadMenu === 'visual' && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in-up origin-top-right overflow-hidden">
                                    <button 
                                        onClick={() => handleSectionDownload('jpg', 'visual-content-area', 'Visual')}
                                        className="w-full flex items-center px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                    >
                                        <FileImage size={14} className={`mr-2.5 text-indigo-500 ${isUrdu ? 'ml-2.5 mr-0' : ''}`} />
                                        {getT('downloadJpg')}
                                    </button>
                                    <button 
                                        onClick={() => handleSectionDownload('pdf', 'visual-content-area', 'Visual')}
                                        className="w-full flex items-center px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-t border-slate-50"
                                    >
                                        <FileDown size={14} className={`mr-2.5 text-red-500 ${isUrdu ? 'ml-2.5 mr-0' : ''}`} />
                                        {getT('downloadPdf')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div id="visual-content-area"
                    className={`relative h-[500px] overflow-hidden bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div 
                        className={`w-full h-full flex items-center justify-center origin-center transition-transform ${isDragging ? 'duration-0' : 'duration-200'} ease-out`}
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` }}
                        ref={visualContainerRef}
                    >
                         <div className="max-w-[90%] max-h-[90%] pointer-events-none select-none">
                            <MermaidDiagram code={visualCode} />
                         </div>
                    </div>
                </div>

                <div className="bg-white px-4 py-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 z-10 relative">
                    <div className="flex items-center">
                         <Grid size={12} className="mr-1.5" />
                         <span>Mermaid.js Renderer v10.9</span>
                    </div>
                    <span>{getT('aiGenerated')}</span>
                </div>
            </div>
             <p className="text-center text-slate-400 text-sm mt-6 no-print">
                {getT('diagramHelp')}
            </p>
          </div>
        );
      case AnswerMode.SHORT:
        const shortText = getContent('short');
        return (
          <div className="animate-fade-in-up">
            <SectionHeader 
                title={getT('shortTitle')} 
                icon={<Zap size={18} />} 
                color="bg-orange-100 text-orange-600" 
                id="short"
                textToCopy={shortText}
            />
            <div id="short-content" className="p-8 bg-gradient-to-r from-orange-50 to-amber-50 border-l-8 border-orange-400 rounded-xl shadow-sm border-t border-r border-b border-orange-100">
               <p className="text-2xl font-medium text-slate-800 italic font-serif leading-normal">
                "{shortText}"
              </p>
            </div>
          </div>
        );
      case AnswerMode.DETAILED:
        const detailedText = getContent('detailed');
        return (
          <div className="animate-fade-in-up">
             <SectionHeader 
                title={getT('detailedTitle')} 
                icon={<FileText size={18} />} 
                color="bg-indigo-100 text-indigo-600" 
                id="detailed"
                textToCopy={detailedText}
            />
             <div id="detailed-content" className="bg-gradient-to-br from-slate-50 to-indigo-50/20 p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
                <div className="prose prose-lg prose-slate max-w-none">
                    <ReactMarkdown components={detailedComponents}>
                        {detailedText}
                    </ReactMarkdown>
                </div>
                <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-center">
                    <div className="h-1.5 w-16 bg-slate-200 rounded-full"></div>
                </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const subjectText = getContent('subject');

  const tabs = [
    { id: AnswerMode.SIMPLE, label: getT('simple'), icon: <BookOpen size={16} /> },
    { id: AnswerMode.STEP_BY_STEP, label: getT('steps'), icon: <List size={16} /> },
    { id: AnswerMode.HANDWRITTEN, label: getT('studyNotes'), icon: <Notebook size={16} /> },
    { id: AnswerMode.EASY_NOTES, label: getT('easyNotes'), icon: <Feather size={16} /> },
    { id: AnswerMode.VISUAL, label: getT('visual'), icon: <ImageIcon size={16} /> },
    { id: AnswerMode.SHORT, label: getT('short'), icon: <Zap size={16} /> },
    { id: AnswerMode.DETAILED, label: getT('detailed'), icon: <FileText size={16} /> },
  ];

  return (
    <div className="w-full mt-8" dir={isUrdu ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <span className="inline-flex items-center px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-bold tracking-wide uppercase shadow-sm">
          <span className={`w-2 h-2 bg-emerald-500 rounded-full ${isUrdu ? 'ml-2' : 'mr-2'}`}></span>
          {subjectText}
        </span>
        <button 
          onClick={handleFullDownload}
          disabled={isGeneratingPdf}
          className="group flex items-center space-x-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium mt-3 sm:mt-0 no-print"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md border border-slate-100 transition-all">
            {isGeneratingPdf ? <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div> : <Download size={16} />}
          </div>
          <span>{isGeneratingPdf ? getT('generating') : getT('savePdf')}</span>
        </button>
      </div>

      <div className="bg-slate-100/50 p-1.5 rounded-2xl mb-8 no-print flex flex-wrap gap-1">
        {tabs.map((tab) => {
             const isActive = activeTab === tab.id;
             return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm flex-1 sm:flex-none justify-center
                  ${isActive 
                    ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' 
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'
                  }
                `}
              >
                <span className={`transition-colors ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                    {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
        })}
      </div>

      <div id="answer-content-export" className="min-h-[300px]">
        {renderContent()}
      </div>
    </div>
  );
};
