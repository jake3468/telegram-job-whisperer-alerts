import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Share2, Twitter, Linkedin } from 'lucide-react';
import { blogData } from '@/data/blogData';
import Footer from '@/components/Footer';
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail_url: string | null;
  author_name: string;
  published_at: string;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  // Get the blog based on the slug
  const blog = slug ? blogData[slug] : undefined;

  // 404 handling
  if (!blog) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-orbitron font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-gray-400 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link to="/blogs" className="inline-flex items-center text-sky-400 hover:text-sky-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const shareUrl = window.location.href;
  const shareText = blog?.title || '';
  const handleShare = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl);
        return;
    }
    window.open(url, '_blank');
  };
  return <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>{blog.meta_title || blog.title}</title>
         <meta name="description" content={blog.meta_description || blog.excerpt} />
         <meta name="keywords" content={blog.tags?.join(', ') || ''} />
         <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
         <meta name="article:published_time" content={blog.published_at} />
         <meta name="article:modified_time" content={blog.published_at} />
         <meta name="article:author" content={blog.author_name || "Aspirely Team"} />
         <link rel="canonical" href={`https://aspirely.ai/blog/${blog.slug}`} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={blog.meta_title || blog.title} />
        <meta property="og:description" content={blog.meta_description || blog.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://aspirely.ai/blog/${blog.slug}`} />
        <meta property="og:site_name" content="Aspirely AI" />
        <meta property="og:image" content={blog.thumbnail_url || "https://aspirely.ai/aspirely-social-preview-updated.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={blog.published_at} />
        <meta property="article:author" content={blog.author_name} />
        {blog.tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
        
         {/* Twitter Card tags */}
         <meta name="twitter:card" content="summary_large_image" />
         <meta name="twitter:site" content="@aspirely_ai" />
         <meta name="twitter:title" content={blog.meta_title || blog.title} />
         <meta name="twitter:description" content={blog.meta_description || blog.excerpt} />
         <meta name="twitter:image" content={blog.thumbnail_url || "https://aspirely.ai/aspirely-social-preview-updated.png"} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "description": blog.meta_description || blog.excerpt,
            "image": blog.thumbnail_url || "https://aspirely.ai/aspirely-social-preview-updated.png",
            "author": {
              "@type": "Person",
              "name": blog.author_name
            },
            "publisher": {
              "@type": "Organization",
              "name": "Aspirely AI",
              "url": "https://aspirely.ai",
              "logo": {
                "@type": "ImageObject",
                "url": "https://aspirely.ai/aspirely-social-preview-updated.png"
              }
            },
            "datePublished": blog.published_at,
             "dateModified": blog.published_at,
             "mainEntityOfPage": {
               "@type": "WebPage",
               "@id": `https://aspirely.ai/blog/${blog.slug}`
             },
             "keywords": blog.tags?.join(", ") || "",
             "url": `https://aspirely.ai/blog/${blog.slug}`,
             "isPartOf": {
               "@type": "Blog",
               "@id": "https://aspirely.ai/blogs"
             },
             "wordCount": blog.content?.replace(/<[^>]*>/g, '').split(' ').length || 0,
             "articleBody": blog.content?.replace(/<[^>]*>/g, '').substring(0, 500) || blog.excerpt
          })}
        </script>
      </Helmet>
      
      <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link to="/blogs" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-8 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Link>

          {/* Blog Header */}
          <div className="mb-8">
            {blog.thumbnail_url && <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-8 w-full shadow-lg">
                <img src={blog.thumbnail_url} alt={`${blog.title} - Featured image for blog post about ${blog.tags?.join(', ') || 'career development'}`} className="w-full h-full object-cover" />
              </div>}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.published_at)}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {blog.author_name}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-sky-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent break-words">
              {blog.title}
            </h1>

            {blog.tags && blog.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map(tag => <Badge key={tag} variant="secondary" className="text-gray-700 bg-gray-100 border border-gray-200 text-xs sm:text-sm">
                    {tag}
                  </Badge>)}
              </div>}

            {/* Share Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-8 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Share:</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="border-blue-500 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm">
                  <Twitter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')} className="border-sky-500 bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm">
                  <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="border-teal-500 bg-teal-500 hover:bg-teal-600 text-white text-xs sm:text-sm">
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>

          {/* Blog Content */}
          <div className="prose prose-lg max-w-none overflow-hidden word-wrap break-words">
            {blog.content ? (
              <SafeHTMLRenderer 
                content={blog.content}
                className="text-gray-800 leading-relaxed [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:lg:text-3xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mb-4 [&>h2]:mt-8 [&>p]:mb-4 [&>p]:text-base [&>p]:sm:text-lg [&>p]:text-gray-700 [&_a]:!text-blue-600 [&_a]:!underline [&_a]:!decoration-blue-600 [&_a]:!underline-offset-2 [&_a]:hover:!text-blue-700 [&_a]:break-words [&_a]:cursor-pointer"
                maxLength={50000}
              />
            ) : (
              <div className="text-gray-500 italic">No content available</div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>;
};
export default BlogPost;