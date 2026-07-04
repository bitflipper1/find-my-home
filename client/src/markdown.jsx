// Minimal markdown -> React elements renderer. Handles exactly the subset
// used by the builder knowledge base: headers, blockquote callouts, GFM
// tables, bullet lists, bold, inline code, and links. Not a general-purpose
// parser — no nested lists, no images, no ordered lists.
import { Fragment } from 'react';

function renderInline(text, keyPrefix) {
  // Split on **bold**, `code`, and [text](url), keeping the delimiters via capture groups.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="px-1 py-0.5 bg-gray-100 rounded text-[0.85em]">{part.slice(1, -1)}</code>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const isExternal = /^https?:\/\//.test(linkMatch[2]);
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-blue-600 hover:underline"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function parseTable(lines) {
  const rows = lines
    .filter(l => !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(l))
    .map(l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()));
  const [header, ...body] = rows;
  return { header, body };
}

export default function Markdown({ content, className = '' }) {
  const lines = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); i++; continue; }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.slice(3) }); i++; continue; }
    if (line.startsWith('# ')) { blocks.push({ type: 'h1', text: line.slice(2) }); i++; continue; }

    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') });
      continue;
    }

    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', ...parseTable(tableLines) });
      continue;
    }

    if (line.trim().startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // paragraph: collect until blank line or a line starting a new block
    const paraLines = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('- ') && !lines[i].startsWith('#') && !lines[i].startsWith('>')) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', text: paraLines.join(' ') });
  }

  return (
    <div className={`markdown-body ${className}`}>
      {blocks.map((b, idx) => {
        const key = `b-${idx}`;
        if (b.type === 'h1') return <h1 key={key} className="text-lg font-bold text-gray-900 mt-4 mb-2 first:mt-0">{renderInline(b.text, key)}</h1>;
        if (b.type === 'h2') return <h2 key={key} className="text-base font-bold text-gray-800 mt-4 mb-1.5">{renderInline(b.text, key)}</h2>;
        if (b.type === 'h3') return <h3 key={key} className="text-sm font-semibold text-gray-700 mt-3 mb-1">{renderInline(b.text, key)}</h3>;
        if (b.type === 'quote') return (
          <blockquote key={key} className="border-l-2 border-amber-300 bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-r-lg my-2">
            {renderInline(b.text, key)}
          </blockquote>
        );
        if (b.type === 'ul') return (
          <ul key={key} className="list-disc pl-5 space-y-1 my-2 text-xs text-gray-700">
            {b.items.map((item, j) => <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>)}
          </ul>
        );
        if (b.type === 'table') return (
          <div key={key} className="overflow-x-auto my-2">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  {b.header.map((h, j) => (
                    <th key={j} className="text-left font-semibold text-gray-600 px-2 py-1.5 whitespace-nowrap">{renderInline(h, `${key}-h${j}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.body.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1.5 text-gray-700">{renderInline(cell, `${key}-${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        return <p key={key} className="text-xs text-gray-600 leading-relaxed my-1.5">{renderInline(b.text, key)}</p>;
      })}
    </div>
  );
}
