import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Share2, Twitter, Linkedin } from 'lucide-react';
import AuthHeader from '@/components/AuthHeader';
import Footer from '@/components/Footer';
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
  const {
    slug
  } = useParams<{
    slug: string;
  }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);
  useEffect(() => {
    if (blog) {
      // Update page meta tags for SEO
      document.title = blog.meta_title || blog.title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', blog.meta_description || blog.excerpt);
      }

      // Fetch related blogs
      fetchRelatedBlogs();
    }
  }, [blog]);
  const fetchBlog = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('blogs').select('*').eq('slug', slug).eq('published', true).single();
      if (error) {
        console.error('Error fetching blog:', error);
        setNotFound(true);
      } else {
        setBlog(data);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };
  const fetchRelatedBlogs = async () => {
    if (!blog) return;
    try {
      const {
        data
      } = await supabase.from('blogs').select('*').eq('published', true).neq('id', blog.id).order('published_at', {
        ascending: false
      }).limit(3);
      if (data) setRelatedBlogs(data);
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };
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
  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading blog post...</div>
      </div>;
  }
  if (notFound || !blog) {
    return <div className="min-h-screen bg-black text-white">
        <AuthHeader />
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-orbitron font-bold mb-6">Blog Post Not Found</h1>
            <p className="text-xl text-gray-300 mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blogs">
              <Button className="bg-sky-600 hover:bg-sky-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blogs
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>;
  }
  return <div className="min-h-screen bg-black text-white">
      <AuthHeader />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Link to="/blogs" className="inline-flex items-center text-sky-400 hover:text-sky-300 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Link>

          {/* Blog Header */}
          <div className="mb-8">
            {blog.thumbnail_url && <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-8">
                <img src={blog.thumbnail_url} alt={blog.title} className="w-full h-full object-cover" />
              </div>}

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.published_at)}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {blog.author_name}
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              {blog.title}
            </h1>

            {blog.tags && blog.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-gray-800 text-gray-300">
                    {tag}
                  </Badge>)}
              </div>}

            {/* Share Buttons */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-700">
              <span className="text-gray-400">Share:</span>
              <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="border-gray-600 bg-blue-500 hover:bg-blue-400 text-zinc-950">
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')} className="border-gray-600 bg-sky-400 hover:bg-sky-300 text-gray-950">
                <Linkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="border-gray-600 bg-teal-300 hover:bg-teal-200 text-zinc-950">
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>

          {/* Blog Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{
            __html: blog.content
          }} />
          </div>

          {/* Related Blogs */}
          {relatedBlogs.length > 0 && <div className="mt-16 pt-16 border-t border-gray-700">
              <h2 className="text-3xl font-orbitron font-bold mb-8 text-center">Related Posts</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedBlogs.map(relatedBlog => <Card key={relatedBlog.id} className="bg-gray-900 border-gray-700 hover:border-sky-500 transition-colors">
                    <Link to={`/blog/${relatedBlog.slug}`}>
                      {relatedBlog.thumbnail_url && <div className="aspect-video bg-gray-800 rounded-t-lg overflow-hidden">
                          <img src={relatedBlog.thumbnail_url} alt={relatedBlog.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>}
                      <CardHeader>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(relatedBlog.published_at)}
                        </div>
                        <h3 className="text-lg font-semibold text-white hover:text-sky-400 transition-colors">
                          {relatedBlog.title}
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300">{relatedBlog.excerpt}</p>
                      </CardContent>
                    </Link>
                  </Card>)}
              </div>
            </div>}
        </div>
      </div>

      <Footer />
    </div>;
};
export default BlogPost;