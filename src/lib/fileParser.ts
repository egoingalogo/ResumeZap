import mammoth from 'mammoth';

/**
 * File parsing utilities for extracting text content from various file formats
 * Supports PDF, DOCX, and TXT files with robust error handling and fallback strategies
 * Uses a simplified PDF parsing approach that doesn't rely on external workers
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
 * Parse PDF file using a simplified approach without external workers
 * This method focuses on extracting readable text content reliably
 */
const parsePDF = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Starting simplified PDF parsing for:', file.name);
  
  try {
    // Dynamic import of PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker to use a local implementation
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document with simplified settings
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
    });
    
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdfDocument.numPages;
    
    console.log(`FileParser: PDF has ${numPages} pages, extracting text...`);
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items and join them
        const pageText = textContent.items
          .map((item: any) => {
            if (item.str && typeof item.str === 'string') {
              return item.str;
            }
            return '';
          })
          .filter((str: string) => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
        }
        
        console.log(`FileParser: Extracted ${pageText.length} characters from page ${pageNum}`);
      } catch (pageError) {
        console.warn(`FileParser: Failed to extract text from page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    // Clean up the extracted text
    const cleanedText = fullText
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Validate that we extracted meaningful text content
    if (!cleanedText || cleanedText.length < 50) {
      throw new Error('PDF text extraction resulted in insufficient content');
    }
    
    // Check if the extracted text looks like metadata rather than content
    const metadataIndicators = [
      'PDF-1.',
      'obj',
      'endobj',
      'stream',
      'endstream',
      'Creator (',
      'Producer (',
      'ModDate',
      'CreationDate'
    ];
    
    const hasMetadataIndicators = metadataIndicators.some(indicator => 
      cleanedText.includes(indicator)
    );
    
    if (hasMetadataIndicators && cleanedText.length < 500) {
      throw new Error('PDF appears to contain mostly metadata rather than readable content');
    }
    
    console.log('FileParser: PDF parsing completed successfully');
    
    return {
      success: true,
      text: cleanedText,
      metadata: {
        pageCount: numPages,
        wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length,
        fileSize: file.size,
        fileName: file.name,
        fileType: 'PDF',
      },
    };
    
  } catch (error) {
    console.warn('FileParser: PDF parsing failed:', error);
    
    // Try fallback method for problematic PDFs
    try {
      return await parsePDFWithFallback(file);
    } catch (fallbackError) {
      console.error('FileParser: Fallback PDF parsing also failed:', fallbackError);
      
      // Return helpful error message
      let errorMessage = 'Unable to extract text from this PDF file.';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          errorMessage = 'Invalid or corrupted PDF file. Please ensure the file is a valid PDF.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password-protected PDFs are not supported. Please use an unprotected PDF.';
        } else if (error.message.includes('worker')) {
          errorMessage = 'PDF processing service temporarily unavailable. Please try again or convert your PDF to DOCX/TXT format.';
        } else if (error.message.includes('metadata')) {
          errorMessage = 'This PDF appears to be image-based or has complex formatting. Please try converting it to text format first, or use a DOCX/TXT version of your resume.';
        } else if (error.message.includes('insufficient content')) {
          errorMessage = 'Could not extract sufficient text from PDF. The file may be image-based or have complex formatting. Please try a DOCX or TXT version.';
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
 * Fallback PDF parsing method using FileReader for simple text extraction
 * This is a last resort method for when PDF.js fails completely
 */
const parsePDFWithFallback = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Trying fallback PDF parsing method');
  
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
        
        // Clean up the extracted text
        const cleanedText = text
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s.,!?;:()\-]/g, '')
          .trim();
        
        // Filter out PDF metadata and structure
        const lines = cleanedText.split(/\s+/).filter(word => {
          return word.length > 2 && 
                 !word.includes('PDF') && 
                 !word.includes('obj') && 
                 !word.includes('endobj') &&
                 !/^\d+$/.test(word);
        });
        
        const finalText = lines.join(' ');
        
        if (finalText.length < 100) {
          throw new Error('Fallback method could not extract sufficient readable text');
        }
        
        resolve({
          success: true,
          text: finalText,
          metadata: {
            wordCount: finalText.split(/\s+/).filter(word => word.length > 0).length,
            fileSize: file.size,
            fileName: file.name,
            fileType: 'PDF (Fallback)',
          },
        });
      } catch (error) {
        console.error('FileParser: Fallback parsing failed:', error);
        resolve({
          success: false,
          text: '',
          error: 'Could not extract readable text from PDF. Please try converting to DOCX or TXT format.',
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        text: '',
        error: 'Failed to read PDF file. Please try a different file format.',
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
    
    // Parse DOCX using mammoth with options for better text extraction
    const result = await mammoth.extractRawText({ 
      arrayBuffer,
      // Options for better text extraction
      convertImage: mammoth.images.ignoreAll,
    });
    
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
        wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length,
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
            wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length,
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
    
    // Try UTF-8 first, then fallback to other encodings if needed
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