const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Secure file upload middleware with enhanced validation
 * - Validates file types using both mimetype and extension
 * - Uses crypto for secure filename generation
 * - Creates upload directories if they don't exist
 * - Includes size limits and file count restrictions
 */

// Allowed file types map with corresponding extensions and mimetypes
const ALLOWED_FILE_TYPES = {
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimetypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  document: {
    extensions: ['.pdf'],
    mimetypes: ['application/pdf']
  }
};

// Create secure upload path based on resource type
const getUploadPath = (resourceType) => {
  // List of valid resource directories
  const validResources = ['events', 'equipment', 'news', 'promotions', 'residents', 'spaces'];
  
  // Default to a general uploads directory if not recognized
  const resource = validResources.includes(resourceType) ? resourceType : 'general';
  
  // Construct the full path
  const uploadPath = path.join('uploads', resource);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  return uploadPath;
};

// Generate secure filename
const generateSecureFilename = (file) => {
  // Get original extension
  const originalExt = path.extname(file.originalname).toLowerCase();
  
  // Generate UUID-like random string using crypto
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  // Add timestamp for additional uniqueness
  const timestamp = Date.now();
  
  // Combine parts for a secure filename
  return `${timestamp}-${randomBytes}${originalExt}`;
};

// Extract resource type from request URL
const getResourceType = (req) => {
  // Extract resource type from URL path
  const urlParts = req.baseUrl.split('/');
  const resourceIndex = urlParts.indexOf('api') + 1;
  
  if (resourceIndex < urlParts.length) {
    return urlParts[resourceIndex];
  }
  
  return 'general';
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Determine resource type and get upload path
      const resourceType = getResourceType(req);
      const uploadPath = getUploadPath(resourceType);
      
      cb(null, uploadPath);
    } catch (error) {
      cb(new ErrorResponse('File upload destination error', 500));
    }
  },
  
  filename: (req, file, cb) => {
    try {
      const secureFilename = generateSecureFilename(file);
      cb(null, secureFilename);
    } catch (error) {
      cb(new ErrorResponse('File naming error', 500));
    }
  }
});

// Enhanced file filter with both mimetype and extension validation
const fileFilter = (req, file, cb) => {
  try {
    // Get file extension and check if it's allowed
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    
    // Check if this is an image upload
    const isValidImage = 
      ALLOWED_FILE_TYPES.image.extensions.includes(ext) &&
      ALLOWED_FILE_TYPES.image.mimetypes.includes(mimetype);
    
    // Check if this is a document upload (for PDFs etc.)
    const isValidDocument = 
      ALLOWED_FILE_TYPES.document.extensions.includes(ext) &&
      ALLOWED_FILE_TYPES.document.mimetypes.includes(mimetype);
    
    if (isValidImage || isValidDocument) {
      cb(null, true);
    } else {
      cb(new ErrorResponse(
        'Invalid file type. Only JPG, PNG, GIF, WEBP and PDF files are allowed.',
        400,
        'Недопустимый тип файла. Разрешены только JPG, PNG, GIF, WEBP и PDF файлы.'
      ), false);
    }
  } catch (error) {
    cb(new ErrorResponse('File validation error', 400));
  }
};

// Initialize multer with enhanced settings
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB file size limit
    files: 5 // Maximum 5 files per upload
  }
});

module.exports = upload;