// Utility function to get the full image URL
export const getImageUrl = (imageUrl) => {
  if (!imageUrl || imageUrl.trim() === '') return null;
  
  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it starts with /uploads, construct the full URL
  if (imageUrl.startsWith('/uploads')) {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_URL.replace('/api', '');
    const fullUrl = `${baseUrl}${imageUrl}`;
    return fullUrl;
  }
  
  // If it's a data URL (base64), return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Otherwise return as is (might be a relative path or external URL)
  return imageUrl;
};

