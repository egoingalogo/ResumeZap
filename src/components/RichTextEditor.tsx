import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, Type, Copy, RotateCcw, Info, Underline } from 'lucide-react';

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
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false
  });

  console.log('RichTextEditor: Rendering with value length:', value.length);

  // Update content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value && !document.activeElement?.contains(editorRef.current)) {
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
   * Update active formatting states based on current selection
   */
  const updateActiveFormats = () => {
    if (!editorRef.current) return;
    
    // Reset active formats when there's no selection
    if (!window.getSelection() || window.getSelection()?.rangeCount === 0) {
      setActiveFormats({
        bold: false,
        italic: false,
        underline: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        insertUnorderedList: false
      });
      return;
    }

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // Reset active formats when there's no selection
        setActiveFormats({
          bold: false,
          italic: false,
          underline: false,
          justifyLeft: false,
          justifyCenter: false,
          justifyRight: false,
          insertUnorderedList: false
        });
        return;
      }

      const newActiveFormats = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList')
      };

      setActiveFormats(newActiveFormats);
    } catch (error) {
      console.warn('RichTextEditor: Failed to update active formats:', error);
    }
  };

  /**
   * Reset formatting when needed
   * This helps prevent formatting from persisting after deletion
   */
  const resetFormattingIfNeeded = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    
    try {
      const range = selection.getRangeAt(0);
      
      // Check if at the beginning of a node or at start of editor
      const isAtStartOfNode = range.startOffset === 0;
      
      if (isAtStartOfNode) {
        // Force update active formats
        const currentFormats = {
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          justifyLeft: document.queryCommandState('justifyLeft'),
          justifyCenter: document.queryCommandState('justifyCenter'),
          justifyRight: document.queryCommandState('justifyRight'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList')
        };
        
        // If UI shows underline is off but formatting is on, reset it
        if (!activeFormats.underline && currentFormats.underline) {
          // Force toggle underline off
          document.execCommand('underline', false);
          document.execCommand('underline', false);
        }
        
        // Same for other formats
        if (!activeFormats.bold && currentFormats.bold) {
          document.execCommand('bold', false);
          document.execCommand('bold', false);
        }
        
        if (!activeFormats.italic && currentFormats.italic) {
          document.execCommand('italic', false);
          document.execCommand('italic', false);
        }
      }
    } catch (err) {
      console.warn('RichTextEditor: Error in resetFormattingIfNeeded', err);
    }
  };
  
  /**
   * Handle content changes with formatting preservation
   */
  const handleContentChange = (e?: Event) => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateCounts();
      updateActiveFormats();
    }
  };

  /**
   * Reset formatting when cursor is at the beginning of a line
   * This helps prevent formatting from persisting after deletion
   */
  const checkAndResetFormatting = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    if (range.startOffset === 0) {
      // If cursor is at the beginning of a line or element, check formatting
      const currentFormats = {
        underline: document.queryCommandState('underline'),
      };
      
      // If underline is active but not shown in UI, update UI
      updateActiveFormats();
    }
  };

  /**
   * Handle key events that might affect formatting
   */
  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Check for keys that might require formatting reset
    if (e.key === 'Backspace' || e.key === 'Delete') {
      resetFormattingIfNeeded();
    }
    
    // Always update formats on key up
    updateActiveFormats();
  };
  
  /**
   * Handle selection changes to update active formatting states
   */
  const handleSelectionChange = () => {
    updateActiveFormats();
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

      // Detect bullet points and lists with proper bullet symbols
      if (/^[•·▪▫‣⁃◦‣]\s/.test(trimmedLine)) {
        const bulletText = trimmedLine.substring(2);
        formattedLine = `<li style="list-style-type: disc; margin-left: 20px;">${bulletText}</li>`;
      } else if (/^[-*+]\s/.test(trimmedLine)) {
        const bulletText = trimmedLine.substring(2);
        formattedLine = `<li style="list-style-type: disc; margin-left: 20px;">${bulletText}</li>`;
      } else if (/^\d+\.\s/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s(.+)/);
        if (match) {
          formattedLine = `<li style="list-style-type: decimal; margin-left: 20px;">${match[2]}</li>`;
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
   * Apply formatting commands with proper state updates
   */
  const applyFormat = (command: string, value?: string) => {
    try {
      // Focus the editor first
      editorRef.current?.focus();

      // Apply the command
      const success = document.execCommand(command, false, value);
      
      if (success) {
        resetFormattingIfNeeded();
        // Handle special cases for list formatting
        if (command === 'insertUnorderedList') {
          // Ensure proper bullet styling
          setTimeout(() => {
            const lists = editorRef.current?.querySelectorAll('ul');
            lists?.forEach(list => {
              list.style.listStyleType = 'disc';
              list.style.paddingLeft = '20px';
              list.style.marginLeft = '0px';
              
              // Style list items
              const items = list.querySelectorAll('li');
              items.forEach(item => {
                item.style.marginBottom = '4px';
              });
            });
          }, 0);
        }
        
        handleContentChange();
      }
    } catch (error) {
      console.error('RichTextEditor: Format command failed:', error);
    }
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
      updateActiveFormats();
    }
  };

  // Set up selection change listener
  useEffect(() => {
    const handleDocumentSelectionChange = () => {
      if (document.activeElement === editorRef.current) updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, []);

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
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.bold
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.italic
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.underline
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('insertUnorderedList')}
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.insertUnorderedList
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
          
          <button
            type="button"
            onClick={() => applyFormat('justifyLeft')}
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.justifyLeft
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('justifyCenter')}
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.justifyCenter
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          
          <button
            type="button"
            onClick={() => applyFormat('justifyRight')}
            className={`p-1.5 rounded transition-colors duration-200 ${
              activeFormats.justifyRight
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
            }`}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
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
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        onMouseUp={() => { handleSelectionChange(); resetFormattingIfNeeded(); }}
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
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+U</kbd> Underline</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Tab</kbd> Indent</span>
          <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+Z</kbd> Undo</span>
        </div>
      </div>
    </div>
  );
};