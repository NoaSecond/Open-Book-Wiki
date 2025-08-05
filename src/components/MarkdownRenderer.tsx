import React from 'react';

interface MarkdownRendererProps {
  content: string;
  searchTerm?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, searchTerm }) => {
  const renderContent = (text: string) => {
    let processedText = text;

    // Highlight search terms
    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      processedText = processedText.replace(
        regex,
        '<mark class="bg-yellow-400 text-black px-1 rounded">$1</mark>'
      );
    }

    return processedText;
  };

  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-slate-300">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: renderContent(item) }} />
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        if (inList) flushList();
        return;
      }

      // Headers
      if (trimmedLine.startsWith('# ')) {
        if (inList) flushList();
        elements.push(
          <h1 key={index} className="text-3xl font-bold text-white mb-6 pb-2 border-b border-slate-600">
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(2)) }} />
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) flushList();
        elements.push(
          <h2 key={index} className="text-2xl font-semibold text-cyan-300 mb-4 mt-8">
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(3)) }} />
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        if (inList) flushList();
        elements.push(
          <h3 key={index} className="text-xl font-semibold text-violet-300 mb-3 mt-6">
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(4)) }} />
          </h3>
        );
      }
      // List items
      else if (trimmedLine.startsWith('- ')) {
        listItems.push(trimmedLine.slice(2));
        inList = true;
      }
      // Bold text
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        if (inList) flushList();
        elements.push(
          <p key={index} className="font-bold text-cyan-300 mb-2 mt-4">
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine.slice(2, -2)) }} />
          </p>
        );
      }
      // Regular paragraphs
      else {
        if (inList) flushList();
        elements.push(
          <p key={index} className="text-slate-300 mb-3 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: renderContent(trimmedLine) }} />
          </p>
        );
      }
    });

    if (inList) flushList();

    return elements;
  };

  return (
    <div className="prose prose-invert max-w-none">
      {parseMarkdown(content)}
    </div>
  );
};