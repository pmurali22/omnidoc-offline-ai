import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (citationText: string) => void;
  showCopyButton?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCitationClick,
  showCopyButton = true
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Helper to parse inline elements including bold, code, and [FileName • Page X] citations
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex matching [FileName • Page X] or standard inline elements
    const parts: React.ReactNode[] = [];
    let remaining = text;

    // Pattern for citations like [Doc.pdf • Page 2] or [Doc.pdf • P.2]
    const citationRegex = /\[([^\]]+?\.(?:pdf|PDF)\s*[•·-]\s*Page\s*\d+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // Push text before citation
      if (match.index > lastIndex) {
        parts.push(renderBasicInline(text.substring(lastIndex, match.index)));
      }

      const citationText = match[1];
      parts.push(
        <button
          key={`cit-${match.index}`}
          onClick={() => onCitationClick && onCitationClick(citationText)}
          className="inline-flex items-center space-x-1 px-1.5 py-0.5 mx-1 my-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-colors align-baseline"
          title={`Click to view source reference: ${citationText}`}
        >
          <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>{citationText}</span>
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(renderBasicInline(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : [renderBasicInline(text)];
  };

  const renderBasicInline = (text: string): React.ReactNode => {
    // Handle bold: **text**
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      // Handle italic: *text*
      const italicParts = part.split(/(\*[^*]+\*)/g);
      return italicParts.map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          return <em key={j} className="italic text-slate-300">{subPart.slice(1, -1)}</em>;
        }
        // Handle code: `code`
        const codeParts = subPart.split(/(`[^`]+`)/g);
        return codeParts.map((codePart, k) => {
          if (codePart.startsWith('`') && codePart.endsWith('`')) {
            return (
              <code key={k} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 text-[11px] font-mono border border-slate-700/60">
                {codePart.slice(1, -1)}
              </code>
            );
          }
          return codePart;
        });
      });
    });
  };

  // Render block elements line-by-line
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let listItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={key} className="list-decimal pl-5 space-y-1.5 my-2.5 text-slate-300">
              {listItems}
            </ol>
          );
        } else {
          elements.push(
            <ul key={key} className="list-disc pl-5 space-y-1.5 my-2.5 text-slate-300">
              {listItems}
            </ul>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    const flushTable = (key: string) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(1);

        elements.push(
          <div key={key} className="overflow-x-auto my-3 border border-slate-800 rounded-xl">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-200 border-b border-slate-700 font-semibold">
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2.5">{renderInline(cell.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-300">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-850/50">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2">{renderInline(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Table line
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList(`list-before-table-${i}`);
        // Skip markdown separator row like |:---|:---|
        if (/^\|(\s*[-:]+\s*\|)+$/.test(trimmed)) {
          continue;
        }
        const cells = trimmed.slice(1, -1).split('|');
        tableRows.push(cells);
        inTable = true;
        continue;
      } else if (inTable) {
        flushTable(`table-${i}`);
      }

      // Headers
      if (trimmed.startsWith('#### ')) {
        flushList(`list-${i}`);
        elements.push(
          <h4 key={i} className="text-sm font-bold text-slate-200 mt-3.5 mb-1.5 flex items-center space-x-1.5">
            {renderInline(trimmed.substring(5))}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('### ')) {
        flushList(`list-${i}`);
        elements.push(
          <h3 key={i} className="text-base font-bold text-white mt-4 mb-2 border-b border-slate-800 pb-1">
            {renderInline(trimmed.substring(4))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushList(`list-${i}`);
        elements.push(
          <h2 key={i} className="text-lg font-bold text-white mt-5 mb-2 border-b border-slate-800 pb-1.5">
            {renderInline(trimmed.substring(3))}
          </h2>
        );
        continue;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***') {
        flushList(`list-${i}`);
        elements.push(<hr key={i} className="border-slate-800 my-3" />);
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushList(`list-${i}`);
        elements.push(
          <blockquote key={i} className="border-l-2 border-indigo-500/80 pl-3.5 py-1 my-2 bg-slate-900/60 rounded-r-lg text-slate-300 italic text-xs">
            {renderInline(trimmed.substring(2))}
          </blockquote>
        );
        continue;
      }

      // Unordered list
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (listType !== 'ul') {
          flushList(`list-${i}`);
          listType = 'ul';
        }
        listItems.push(
          <li key={`li-${i}`} className="leading-relaxed text-xs">
            {renderInline(trimmed.substring(2))}
          </li>
        );
        continue;
      }

      // Ordered list
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (listType !== 'ol') {
          flushList(`list-${i}`);
          listType = 'ol';
        }
        listItems.push(
          <li key={`li-${i}`} className="leading-relaxed text-xs">
            {renderInline(olMatch[2])}
          </li>
        );
        continue;
      }

      // Empty line
      if (trimmed === '') {
        flushList(`list-${i}`);
        continue;
      }

      // Regular paragraph
      flushList(`list-${i}`);
      elements.push(
        <p key={i} className="text-xs text-slate-300 leading-relaxed my-1.5">
          {renderInline(trimmed)}
        </p>
      );
    }

    flushList('list-end');
    flushTable('table-end');

    return elements;
  };

  return (
    <div className="relative group">
      {showCopyButton && content.length > 0 && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center space-x-1 shadow transition-colors"
          title="Copy markdown text"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      )}

      <div className="prose prose-invert max-w-none text-xs">
        {renderBlocks()}
      </div>
    </div>
  );
};
