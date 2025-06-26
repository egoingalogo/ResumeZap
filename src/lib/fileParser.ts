import mammoth from 'mammoth';

/**
 * File parsing utilities for extracting text content from various file formats
 * Supports PDF, DOCX, and TXT files with proper error handling and progress tracking
 * Uses multiple PDF parsing strategies for maximum compatibility and readable text extraction
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
 * 1. Try PDF.js with proper text extraction
 * 2. Try alternative PDF.js configuration
 * 3. Fallback with user guidance
 */
const parsePDF = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Starting PDF parsing for:', file.name);
  
  // Strategy 1: Try PDF.js with proper worker setup and text extraction
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker with multiple fallback options
    const workerUrls = [
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js`,
      `/pdf.worker.js`, // Local fallback
    ];
    
    let workerConfigured = false;
    let lastWorkerError = null;
    
    for (const workerUrl of workerUrls) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        
        // Test worker by trying to load a minimal PDF
        const testArrayBuffer = await file.arrayBuffer();
        const testTask = pdfjsLib.getDocument({
          data: testArrayBuffer.slice(0, Math.min(1024, testArrayBuffer.byteLength)),
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          verbosity: 0, // Reduce console noise
        });
        
        // Try to get the document to test worker
        await testTask.promise.catch(() => {}); // Ignore error, just testing worker
        
        workerConfigured = true;
        console.log('FileParser: PDF.js worker configured with:', workerUrl);
        break;
      } catch (error) {
        lastWorkerError = error;
        console.warn('FileParser: Failed to configure worker with:', workerUrl, error);
        continue;
      }
    }
    
    if (!workerConfigured) {
      throw new Error(`Could not configure PDF.js worker. Last error: ${lastWorkerError}`);
    }
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document with optimized settings for text extraction
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
      // Optimize for text extraction
      disableFontFace: true,
      disableRange: false,
      disableStream: false,
    });
    
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdfDocument.numPages;
    
    console.log(`FileParser: PDF has ${numPages} pages, extracting text...`);
    
    // Extract text from each page with better text processing
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false,
        });
        
        // Process text items with better spacing and structure preservation
        let pageText = '';
        let lastY = null;
        let lastX = null;
        
        for (const item of textContent.items) {
          if (item.str && typeof item.str === 'string') {
            const currentY = item.transform ? item.transform[5] : 0;
            const currentX = item.transform ? item.transform[4] : 0;
            
            // Add line breaks for significant Y position changes (new lines)
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
              pageText += '\n';
            }
            // Add spaces for significant X position changes (word spacing)
            else if (lastX !== null && currentX - lastX > 10) {
              pageText += ' ';
            }
            
            pageText += item.str;
            lastY = currentY;
            lastX = currentX + (item.width || 0);
          }
        }
        
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
      .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2') // Add proper paragraph breaks
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
      'xref',
      'trailer',
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
    console.warn('FileParser: PDF.js parsing failed:', error);
    
    // Strategy 2: Try alternative PDF parsing approach
    try {
      return await parsePDFAlternative(file);
    } catch (alternativeError) {
      console.error('FileParser: Alternative PDF parsing also failed:', alternativeError);
      
      // Return helpful error message based on the type of failure
      let errorMessage = 'Failed to extract readable text from PDF.';
      
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
 * Alternative PDF parsing method using different PDF.js configuration
 * Attempts to extract text with different settings for problematic PDFs
 */
const parsePDFAlternative = async (file: File): Promise<ParseResult> => {
  console.log('FileParser: Trying alternative PDF parsing method');
  
  const pdfjsLib = await import('pdfjs-dist');
  const arrayBuffer = await file.arrayBuffer();
  
  // Try with different PDF.js settings
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: false, // Different setting
    verbosity: 0,
    disableFontFace: false, // Different setting
    disableRange: true, // Different setting
    disableStream: true, // Different setting
    // Try to force text extraction
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  });
  
  const pdfDocument = await loadingTask.promise;
  let fullText = '';
  const numPages = pdfDocument.numPages;
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDocument.getPage(pageNum);
      
      // Try different text extraction method
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: true, // Different setting
      });
      
      // Simple text extraction without position processing
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .filter((str: string) => str.trim().length > 0)
        .join(' ');
      
      if (pageText.trim()) {
        fullText += pageText + '\n';
      }
    } catch (pageError) {
      console.warn(`FileParser: Alternative method failed on page ${pageNum}:`, pageError);
    }
  }
  
  const cleanedText = fullText
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanedText || cleanedText.length < 50) {
    throw new Error('Alternative PDF parsing also resulted in insufficient content');
  }
  
  return {
    success: true,
    text: cleanedText,
    metadata: {
      pageCount: numPages,
      wordCount: cleanedText.split(/\s+/).filter(word => word.length > 0).length,
      fileSize: file.size,
      fileName: file.name,
      fileType: 'PDF (Alternative)',
    },
  };
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