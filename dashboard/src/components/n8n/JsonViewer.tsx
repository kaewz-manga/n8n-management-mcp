import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';

function JsonNode({ name, value, depth = 0 }: { name?: string; value: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) return <span className="text-gray-400">null</span>;
  if (typeof value === 'boolean') return <span className="text-purple-600">{String(value)}</span>;
  if (typeof value === 'number') return <span className="text-blue-600">{value}</span>;
  if (typeof value === 'string') return <span className="text-green-700">"{value.length > 200 ? value.slice(0, 200) + '...' : value}"</span>;

  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((v, i) => [String(i), v]) : Object.entries(value);
  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div>
      <span
        className="cursor-pointer hover:bg-gray-100 rounded inline-flex items-center gap-0.5"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
        {name && <span className="text-gray-800 font-medium">{name}: </span>}
        {!expanded && <span className="text-gray-400">{bracket[0]} {entries.length} items {bracket[1]}</span>}
        {expanded && <span className="text-gray-400">{bracket[0]}</span>}
      </span>
      {expanded && (
        <div className="ml-4 border-l border-gray-200 pl-2">
          {entries.map(([key, val]) => (
            <div key={key} className="py-0.5">
              {typeof val === 'object' && val !== null ? (
                <JsonNode name={key} value={val} depth={depth + 1} />
              ) : (
                <span>
                  <span className="text-gray-800 font-medium">{key}: </span>
                  <JsonNode value={val} depth={depth + 1} />
                </span>
              )}
            </div>
          ))}
          <span className="text-gray-400">{bracket[1]}</span>
        </div>
      )}
    </div>
  );
}

export default function JsonViewer({ data, title }: { data: any; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-600">{title}</span>
          <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600" title="Copy JSON">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      <div className="p-3 font-mono text-xs overflow-auto max-h-96">
        <JsonNode value={data} />
      </div>
    </div>
  );
}
