
import React, { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
  code: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { curve: 'basis', htmlLabels: false },
        logLevel: 5 
      });
    }
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !window.mermaid || !code) return;

      try {
        containerRef.current.innerHTML = '';
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Sanitize code: remove markdown code blocks and trim whitespace
        const cleanCode = code
          .replace(/```mermaid/g, '')
          .replace(/```/g, '')
          .trim();

        const { svg } = await window.mermaid.render(id, cleanCode);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          // Make the SVG responsive
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.width = '100%'; 
          }
        }
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
        if (containerRef.current) {
            // Show a friendlier error message, but keep technical details in console
            containerRef.current.innerHTML = `
              <div class="p-4 text-red-600 bg-red-50 rounded-lg border border-red-100 text-center text-sm">
                <p class="font-semibold">Unable to render diagram</p>
                <p class="text-xs mt-1 text-red-400">Syntax error in generated visualization</p>
              </div>`;
        }
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
      <div className="w-full overflow-x-auto flex justify-center">
        <div ref={containerRef} className="mermaid-container w-full flex justify-center min-w-[300px]" />
      </div>
    </div>
  );
};
