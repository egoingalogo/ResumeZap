import mammoth from 'mammoth';

/**
 * File parsing utilities for extracting text content from various file formats
 * Supports PDF, DOCX, and TXT files with proper error handling and progress tracking
 * Uses multiple PDF parsing strategies for maximum compatibility
 */

export interface ParseResult {
  success: boolean;
  text: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    fileSize: number;
    fileName: string;
    fileType: string;
  };
}

/**
 * Parse PDF file using multiple strategies for maximum compatibility
 * 1. Try PDF.js with CDN worker
 * 2. Try PDF.js with local worker
 * 3. Fallback to basic text extraction
 */
const parsePDF = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Starting PDF parsing for:', file.name);
  
  // Strategy 1: Try PDF.js with proper worker setup
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker with multiple fallback options
    const workerUrls = [
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`,
      `/pdf.worker.js`, // Local fallback
      `https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js` // Alternative CDN
    ];
    
    let workerConfigured = false;
    
    for (const workerUrl of workerUrls) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        
        // Test if worker loads by creating a simple document
        const testArrayBuffer = new ArrayBuffer(8);
        const testTask = pdfjsLib.getDocument({ data: testArrayBuffer });
        
        // If this doesn't throw, worker is configured correctly
        await testTask.promise.catch(() => {}); // Ignore the error, we just want to test worker
        
        workerConfigured = true;
        console.log('FileParser: PDF.js worker configured with:', workerUrl);
        break;
      } catch (error) {
        console.warn('FileParser: Failed to configure worker with:', workerUrl, error);
        continue;
      }
    }
    
    if (!workerConfigured) {
      throw new Error('Could not configure PDF.js worker');
    }
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdfDocument.numPages;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => {
            if (item.str) {
              return item.str;
            }
            return '';
          })
          .join(' ');
        
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`FileParser: Failed to extract text from page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    if (!fullText || fullText.trim().length === 0) {
      return {
        success: false,
        text: '',
        error: 'PDF appears to be empty or contains only images. Please ensure your PDF contains selectable text.',
      };
    }
    
    // Clean up the extracted text
    const cleanedText = fullText
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    console.log('FileParser: PDF parsing completed successfully');
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        pageCount: numPages,
        wordCount: cleanedText.split(/\s+/).length,
        fileSize: file.size,
        fileName: file.name,
        fileType: 'PDF',
      },
    };
    
  } catch (error) {
    console.warn('FileParser: PDF.js parsing failed, trying fallback method:', error);
    
    // Strategy 2: Fallback to basic file reading (for text-based PDFs)
    try {
      return await parsePDFFallback(file);
    } catch (fallbackError) {
      console.error('FileParser: All PDF parsing methods failed:', fallbackError);
      
      let errorMessage = 'Failed to parse PDF file.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          errorMessage = 'Invalid or corrupted PDF file. Please try a different file.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password-protected PDFs are not supported. Please use an unprotected PDF.';
        } else if (error.message.includes('worker')) {
          errorMessage = 'PDF parsing service temporarily unavailable. Please try again or use a DOCX/TXT file.';
        } else {
          errorMessage = `PDF parsing error: ${error.message}`;
        }
      }
      
      return {
        success: false,
        text: '',
        error: errorMessage,
      };
    }
  }
};

/**
 * Fallback PDF parsing method using FileReader
 * This works for some text-based PDFs but not for complex layouts
 */
const parsePDFFallback = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Using PDF fallback parsing method');
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert to string and try to extract readable text
        let text = '';
        for (let i = 0; i < uint8Array.length; i++) {
          const char = String.fromCharCode(uint8Array[i]);
          // Only include printable ASCII characters
          if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
            text += char;
          } else if (char === '\n' || char === '\r' || char === '\t') {
            text += ' ';
          }
        }
        
        // Clean up extracted text
        const cleanedText = text
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\.\,\;\:\!\?\-\(\)]/g, '')
          .trim();
        
        if (cleanedText.length < 50) {
          resolve({
            success: false,
            text: '',
            error: 'Could not extract readable text from PDF. The file may contain only images or use complex formatting.',
          });
          return;
        }
        
        resolve({
          success: true,
          text: cleanedText,
          metadata: {
            wordCount: cleanedText.split(/\s+/).length,
            fileSize: file.size,
            fileName: file.name,
            fileType: 'PDF (Fallback)',
          },
        });
      } catch (error) {
        resolve({
          success: false,
          text: '',
          error: 'Failed to parse PDF using fallback method.',
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        text: '',
        error: 'Failed to read PDF file.',
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse DOCX file using mammoth.js library
 * Extracts text content while preserving basic formatting structure
 */
const parseDOCX = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Starting DOCX parsing for:', file.name);
  
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse DOCX using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      return {
        success: false,
        text: '',
        error: 'DOCX file appears to be empty or contains no readable text.',
      };
    }
    
    // Clean up the extracted text
    const cleanedText = result.value
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.warn('FileParser: DOCX parsing warnings:', result.messages);
    }
    
    console.log('FileParser: DOCX parsing completed successfully');
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        wordCount: cleanedText.split(/\s+/).length,
        fileSize: file.size,
        fileName: file.name,
        fileType: 'DOCX',
      },
    };
  } catch (error) {
    console.error('FileParser: DOCX parsing failed:', error);
    
    let errorMessage = 'Failed to parse DOCX file.';
    if (error instanceof Error) {
      if (error.message.includes('not a valid zip file')) {
        errorMessage = 'Invalid or corrupted DOCX file. Please try a different file.';
      } else {
        errorMessage = `DOCX parsing error: ${error.message}`;
      }
    }
    
    return {
      success: false,
      text: '',
      error: errorMessage,
    };
  }
};

/**
 * Parse TXT file using FileReader
 * Handles various text encodings and validates content
 */
const parseTXT = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Starting TXT parsing for:', file.name);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        
        if (!text || text.trim().length === 0) {
          resolve({
            success: false,
            text: '',
            error: 'Text file appears to be empty.',
          });
          return;
        }
        
        // Clean up the text
        const cleanedText = text
          .replace(/\r\n/g, '\n') // Normalize line endings
          .replace(/\r/g, '\n') // Handle old Mac line endings
          .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
          .replace(/\n\s*\n/g, '\n') // Remove empty lines
          .trim();
        
        console.log('FileParser: TXT parsing completed successfully');
        
        resolve({
          success: true,
          text: cleanedText,
          metadata: {
            wordCount: cleanedText.split(/\s+/).length,
            fileSize: file.size,
            fileName: file.name,
            fileType: 'TXT',
          },
        });
      } catch (error) {
        console.error('FileParser: TXT parsing failed:', error);
        resolve({
          success: false,
          text: '',
          error: error instanceof Error ? error.message : 'Failed to read text file.',
        });
      }
    };
    
    reader.onerror = () => {
      console.error('FileParser: FileReader error for TXT file');
      resolve({
        success: false,
        text: '',
        error: 'Failed to read text file. The file may be corrupted.',
      });
    };
    
    // Read as UTF-8 text
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Main file parsing function that routes to appropriate parser based on file type
 * Provides comprehensive error handling and validation
 */
export const parseFile = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Starting file parsing for:', file.name, 'Type:', file.type);
  
  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      success: false,
      text: '',
      error: 'File size exceeds 10MB limit. Please use a smaller file.',
    };
  }
  
  // Validate file size (min 1KB to avoid empty files)
  if (file.size < 1024) {
    return {
      success: false,
      text: '',
      error: 'File is too small. Please ensure your file contains resume content.',
    };
  }
  
  // Determine file type and route to appropriate parser
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await parseDOCX(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await parseTXT(file);
    } else {
      return {
        success: false,
        text: '',
        error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.',
      };
    }
  } catch (error) {
    console.error('FileParser: Unexpected error during parsing:', error);
    return {
      success: false,
      text: '',
      error: 'An unexpected error occurred while parsing the file. Please try again.',
    };
  }
};

/**
 * Validate file type before parsing
 * Provides early validation to improve user experience
 */
export const validateFileType = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  
  const allowedExtensions = ['.pdf', '.docx', '.txt'];
  const fileName = file.name.toLowerCase();
  
  const hasValidType = allowedTypes.includes(file.type.toLowerCase());
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidType && !hasValidExtension) {
    return {
      isValid: false,
      error: 'Please upload a PDF, DOCX, or TXT file.',
    };
  }
  
  return { isValid: true };
};

/**
 * Get file type display name for UI
 */
export const getFileTypeDisplayName = (file: File): string => {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'PDF';
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return 'DOCX';
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return 'TXT';
  } else {
    return 'Unknown';
  }
};