import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, Type, MoreHorizontal, Copy, Cast as Paste, RotateCcw, Info } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
  showWordCount?: boolean;
}

/**
 * Rich text editor component that preserves formatting from pasted content
 * Supports bullet points, symbols, indentation, and various text formatting
 * Maintains document structure while providing editing capabilities
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Paste your content here...",
  rows = 8,
  className = "",
  label,
  showWordCount = true
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  console.log('RichTextEditor: Rendering with value length:', value.length);

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      updateCounts();
    }
  }, [value]);

  // Update word and character counts
  const updateCounts = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      setWordCount(words);
      setCharCount(chars);
    }
  };

  /**
   * Handle content changes with formatting preservation
   */
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateCounts();
    }
  };

  /**
   * Handle paste events to preserve formatting from external sources
   */
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsFormatting(true);

    try {
      const clipboardData = e.clipboardData;
      
      // Try to get HTML content first (preserves formatting)
      let htmlContent = clipboardData.getData('text/html');
      
      if (htmlContent) {
        console.log('RichTextEditor: Pasting HTML content with formatting');
        
        // Clean and sanitize HTML while preserving structure
        htmlContent = sanitizeAndPreserveHTML(htmlContent);
        
        // Insert the formatted content
        document.execCommand('insertHTML', false, htmlContent);
      } else {
        // Fallback to plain text with smart formatting detection
        const plainText = clipboardData.getData('text/plain');
        console.log('RichTextEditor: Pasting plain text with smart formatting');
        
        const formattedText = enhancePlainText(plainText);
        document.execCommand('insertHTML', false, formattedText);
      }
      
      handleContentChange();
    } catch (error) {
      console.error('RichTextEditor: Paste error:', error);
      // Fallback to default paste behavior
      const plainText = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, plainText);
      handleContentChange();
    } finally {
      setIsFormatting(false);
    }
  };

  /**
   * Sanitize HTML content while preserving important formatting
   */
  const sanitizeAndPreserveHTML = (html: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove unwanted elements and attributes while preserving structure
    const allowedTags = ['p', 'div', 'span', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const allowedAttributes = ['style'];

    // Recursively clean elements
    const cleanElement = (element: Element): string => {
      const tagName = element.tagName.toLowerCase();
      
      if (!allowedTags.includes(tagName)) {
        // If tag is not allowed, return its text content with line breaks
        return element.textContent + '<br>';
      }

      let result = `<${tagName}`;
      
      // Preserve certain style attributes
      const style = element.getAttribute('style');
      if (style) {
        // Filter style to only include safe formatting
        const safeStyles = style
          .split(';')
          .filter(s => {
            const prop = s.split(':')[0]?.trim().toLowerCase();
            return ['font-weight', 'font-style', 'text-decoration', 'text-align', 'margin-left', 'padding-left'].includes(prop);
          })
          .join(';');
        
        if (safeStyles) {
          result += ` style="${safeStyles}"`;
        }
      }
      
      result += '>';
      
      // Process child nodes
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          result += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          result += cleanElement(child as Element);
        }
      }
      
      result += `</${tagName}>`;
      return result;
    };

    let cleanedHTML = '';
    for (const child of Array.from(tempDiv.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        cleanedHTML += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        cleanedHTML += cleanElement(child as Element);
      }
    }

    return cleanedHTML;
  };

  /**
   * Enhance plain text with smart formatting detection
   */
  const enhancePlainText = (text: string): string => {
    const lines = text.split('\n');
    let formattedHTML = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        formattedHTML += '<br>';
        continue;
      }

      // Detect and format different types of content
      let formattedLine = '';

      // Detect bullet points and lists
      if (/^[•·▪▫‣⁃◦‣]\s/.test(trimmedLine)) {
        formattedLine = `<div style="margin-left: 20px;">• ${trimmedLine.substring(2)}</div>`;
      } else if (/^[-*+]\s/.test(trimmedLine)) {
        formattedLine = `<div style="margin-left: 20px;">• ${trimmedLine.substring(2)}</div>`;
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s(.+)/);
        if (match) {
          formattedLine = `<div style="margin-left: 20px;">${match[1]}. ${match[2]}</div>`;
        }
      }
      // Detect headings (ALL CAPS or ending with colon)
      else if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100) {
        formattedLine = `<div style="font-weight: bold; margin-top: 10px; margin-bottom: 5px;">${trimmedLine}</div>`;
      } else if (trimmedLine.endsWith(':') && trimmedLine.length < 100) {
        formattedLine = `<div style="font-weight: bold; margin-top: 8px; margin-bottom: 3px;">${trimmedLine}</div>`;
      }
      // Detect indented content
      else if (line.startsWith('    ') || line.startsWith('\t')) {
        const indentLevel = line.startsWith('\t') ? 1 : Math.floor((line.length - line.trimStart().length) / 4);
        formattedLine = `<div style="margin-left: ${indentLevel * 20}px;">${trimmedLine}</div>`;
      }
      // Regular paragraph
      else {
        formattedLine = `<div>${trimmedLine}</div>`;
      }

      formattedHTML += formattedLine;
    }

    return formattedHTML;
  };

  /**
   * Apply formatting commands
   */
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+B for bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      applyFormat('bold');
    }
    // Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      applyFormat('italic');
    }
    // Ctrl+U for underline
    else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      applyFormat('underline');
    }
    // Ctrl+Z for undo
    else if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      applyFormat('undo');
    }
    // Tab for indentation
    else if (e.key === 'Tab') {
      e.preventDefault();
      applyFormat('indent');
    }
    // Shift+Tab for outdent
    else if (e.shiftKey && e.key === 'Tab') {
      e.preventDefault();
      applyFormat('outdent');
    }
  };

  /**
   * Copy content to clipboard
   */
  const copyContent = async () => {
    if (editorRef.current) {
      try {
        const html = editorRef.current.innerHTML;
        const text = editorRef.current.innerText;
        
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          })
        ]);
        
        console.log('RichTextEditor: Content copied to clipboard');
      } catch (error) {
        console.error('RichTextEditor: Copy failed:', error);
        // Fallback to text copy
        await navigator.clipboard.writeText(editorRef.current.innerText);
      }
    }
  };

  /**
   * Clear all content
   */
  const clearContent = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      onChange('');
      updateCounts();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      {/* Formatting Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-t-lg">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('insertUnorderedList')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Bullet List"
          >
            <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          
          <button
            type="button"
            onClick={() => applyFormat('justifyLeft')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('justifyCenter')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('justifyRight')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={copyContent}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Copy Content"
          >
            <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('undo')}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button
            type="button"
            onClick={clearContent}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
            title="Clear All"
          >
            <Type className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
      
      {/* Rich Text Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-3 border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none overflow-y-auto transition-all duration-200 ${
          isFormatting ? 'opacity-75' : ''
        }`}
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          maxHeight: '400px'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      
      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Info className="h-3 w-3" />
            <span>Paste content to preserve formatting</span>
          </div>
          {isFormatting && (
            <span className="text-purple-600 dark:text-purple-400">Processing formatting...</span>
          )}
        </div>
        
        {showWordCount && (
          <div className="flex items-center space-x-4">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        )}
      </div>
      
      {/* Formatting Help */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>Shortcuts:</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+B</kbd> Bold</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+I</kbd> Italic</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Tab</kbd> Indent</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+Z</kbd> Undo</span>
        </div>
      </div>
    </div>
  );
};