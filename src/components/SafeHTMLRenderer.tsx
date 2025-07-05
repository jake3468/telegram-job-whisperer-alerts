
import React from 'react';
import { sanitizeHTML } from '@/utils/sanitize';

interface SafeHTMLRendererProps {
  content: string;
  className?: string;
  maxLength?: number;
}

export const SafeHTMLRenderer: React.FC<SafeHTMLRendererProps> = ({ 
  content, 
  className = "",
  maxLength = 50000 // Increased limit for blog posts
}) => {
  // Only truncate if content is extremely long to prevent DoS
  const truncatedContent = content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;
  
  const sanitizedContent = sanitizeHTML(truncatedContent);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
