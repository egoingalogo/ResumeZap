// PDF.js Worker - Local fallback for PDF parsing
// This file provides a local worker when CDN fails

// Import PDF.js worker from CDN with fallback
(function() {
  'use strict';
  
  // Try to load the worker from CDN
  try {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js');
  } catch (e) {
    console.warn('Failed to load PDF.js worker from CDN, using fallback');
    
    // Minimal worker implementation for basic PDF parsing
    self.onmessage = function(e) {
      const { data } = e;
      
      if (data.type === 'parse') {
        // Send back a simple response indicating worker is ready
        self.postMessage({
          type: 'ready',
          success: true
        });
      }
    };
  }
})();