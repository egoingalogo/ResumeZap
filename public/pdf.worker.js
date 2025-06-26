// PDF.js Worker - Enhanced local fallback for PDF parsing
// This file provides a more robust local worker when CDN fails

(function() {
  'use strict';
  
  console.log('PDF Worker: Initializing local PDF.js worker');
  
  // Try to load the worker from multiple CDN sources
  const workerSources = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js',
    'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js'
  ];
  
  let workerLoaded = false;
  
  // Try each worker source
  for (const source of workerSources) {
    try {
      console.log('PDF Worker: Attempting to load from:', source);
      importScripts(source);
      workerLoaded = true;
      console.log('PDF Worker: Successfully loaded from:', source);
      break;
    } catch (e) {
      console.warn('PDF Worker: Failed to load from:', source, e.message);
      continue;
    }
  }
  
  if (!workerLoaded) {
    console.warn('PDF Worker: All CDN sources failed, using minimal fallback');
    
    // Minimal worker implementation for basic PDF parsing
    self.onmessage = function(e) {
      const { data } = e;
      
      try {
        if (data.type === 'getDocument') {
          // Send back a response indicating we can't process this PDF
          self.postMessage({
            type: 'error',
            error: 'PDF worker not available - please try converting your PDF to DOCX or TXT format'
          });
        } else {
          // Send back a ready response
          self.postMessage({
            type: 'ready',
            success: false,
            error: 'PDF worker not fully functional'
          });
        }
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: 'PDF worker error: ' + error.message
        });
      }
    };
    
    // Signal that worker is ready (but limited)
    self.postMessage({
      type: 'workerReady',
      success: false,
      message: 'Limited PDF worker loaded'
    });
  } else {
    // Signal that full worker is ready
    self.postMessage({
      type: 'workerReady',
      success: true,
      message: 'Full PDF worker loaded successfully'
    });
  }
})();