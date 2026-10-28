import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Folder, Terminal, Sparkles } from 'lucide-react';
import { GeneratedLibrary, GeneratedLibraryFile } from '../types/library';
import { downloadSingleFile } from '../utils/zipExporter';

interface CodeViewerProps {
  library: GeneratedLibrary;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ library }) => {
  const [activeFilePath, setActiveFilePath] = useState<string>(
    library.files.find((f) => f.filename.endsWith('.h'))?.path || library.files[0]?.path || ''
  );
  const [copied, setCopied] = useState<boolean>(false);

  const activeFile: GeneratedLibraryFile =
    library.files.find((f) => f.path === activeFilePath) || library.files[0];

  const handleCopy = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!activeFile) return;
    downloadSingleFile(activeFile.filename, activeFile.content);
  };

  // Split lines for line numbers
  const lines = (activeFile?.content || '').split('\n');

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      {/* File Tab Strip */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-2 py-1.5 overflow-x-auto">
        <div className="flex items-center gap-1">
          {library.files.map((file) => {
            const isActive = file.path === activeFilePath;
            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setActiveFilePath(file.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{file.filename}</span>
              </button>
            );
          })}
        </div>

        {/* Copy & Download Single File */}
        <div className="flex items-center gap-2 pl-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors whitespace-nowrap"
            title={`Download ${activeFile?.filename}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File Purpose & Metadata */}
      {activeFile && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Path:</span>
            <span className="text-slate-300 font-semibold">{activeFile.path}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-[11px] font-sans truncate max-w-lg">
              {activeFile.description}
            </span>
          </div>
          <span className="text-slate-500 tabular-nums">{lines.length} lines</span>
        </div>
      )}

      {/* Code Viewer with Line Numbers */}
      <div className="relative font-mono text-xs overflow-auto max-h-[580px] bg-[#0b0f19]">
        <div className="flex min-w-full">
          {/* Line Numbers Column */}
          <div className="py-4 px-3 bg-[#080c14] select-none text-right text-slate-600 border-r border-slate-800/80 text-[11px] leading-5 shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="tabular-nums">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Text Column */}
          <pre className="py-4 px-4 text-slate-200 leading-5 overflow-x-auto whitespace-pre font-mono flex-1">
            <code>
              {lines.map((line, idx) => (
                <div key={idx} className="hover:bg-slate-800/30 px-1 -mx-1 rounded">
                  {highlightCppLine(line)}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* Quick IDE import instruction */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Install directly into Arduino IDE:</span>
          <code className="text-slate-300 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Sketch &gt; Include Library &gt; Add .ZIP Library...
          </code>
        </div>
        <span className="text-slate-500 font-mono">Arduino 1.5+ Spec</span>
      </div>
    </div>
  );
};

// Syntax high-lighting helper
function highlightCppLine(line: string): React.ReactNode {
  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
    return <span className="text-emerald-400/80 italic">{line}</span>;
  }

  // Preprocessor directives
  if (line.trim().startsWith('#')) {
    return <span className="text-purple-400 font-semibold">{line}</span>;
  }

  // Keywords replacement
  const keywords = [
    'class',
    'struct',
    'enum',
    'public',
    'private',
    'protected',
    'static',
    'volatile',
    'const',
    'virtual',
    'bool',
    'void',
    'uint8_t',
    'uint16_t',
    'uint32_t',
    'int8_t',
    'int16_t',
    'int32_t',
    'float',
    'double',
    'return',
    'if',
    'else',
    'for',
    'while',
    'switch',
    'case',
    'break',
    'default',
    'nullptr',
    'true',
    'false',
  ];

  // Strings
  if (line.includes('"') || line.includes("'")) {
    const parts = line.split(/("[^"]*")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={i} className="text-amber-300">
            {part}
          </span>
        );
      }
      return <span key={i}>{highlightKeywords(part, keywords)}</span>;
    });
  }

  return highlightKeywords(line, keywords);
}

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  const words = text.split(/(\b\w+\b)/g);
  return words.map((word, i) => {
    if (keywords.includes(word)) {
      return (
        <span key={i} className="text-cyan-400 font-semibold">
          {word}
        </span>
      );
    }
    return word;
  });
}
