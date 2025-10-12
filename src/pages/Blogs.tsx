import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, User, ArrowLeft } from 'lucide-react';
import { getAllBlogs } from '@/data/blogData';
import Footer from '@/components/Footer';
interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail_url: string | null;
  author_name: string;
  published_at: string;
  tags: string[];
  featured: boolean;
}
const Blogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllTags, setShowAllTags] = useState(false);
  
  const blogs = getAllBlogs();

  useEffect(() => {
    // Simulate initial loading for smooth UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) || blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || blog.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });
  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags || [])));
  
  // Calculate tag counts and sort by popularity
  const tagCounts = allTags.map(tag => ({
    tag,
    count: blogs.filter(blog => blog.tags?.includes(tag)).length
  })).sort((a, b) => b.count - a.count);
  
  // Display top 8 tags by default, or all if showAllTags is true
  const displayedTags = showAllTags ? tagCounts : tagCounts.slice(0, 8);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Career Insights & Job Search Tips - Aspirely AI Blog</title>
        <meta name="description" content="Discover career insights, job search strategies, interview tips, and industry updates to accelerate your professional growth with Aspirely AI's expert blog." />
         <meta name="keywords" content="career advice, job search tips, interview preparation, career development, professional growth, job hunting strategies" />
         <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
         <link rel="canonical" href="https://aspirely.ai/blogs" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Career Insights & Job Search Tips - Aspirely AI Blog" />
        <meta property="og:description" content="Discover career insights, job search strategies, interview tips, and industry updates to accelerate your professional growth with Aspirely AI's expert blog." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aspirely.ai/blogs" />
        <meta property="og:site_name" content="Aspirely AI" />
        <meta property="og:image" content="https://aspirely.ai/aspirely-social-preview-updated.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
         {/* Twitter Card tags */}
         <meta name="twitter:card" content="summary_large_image" />
         <meta name="twitter:site" content="@aspirely_ai" />
         <meta name="twitter:title" content="Career Insights & Job Search Tips - Aspirely AI Blog" />
         <meta name="twitter:description" content="Discover career insights, job search strategies, interview tips, and industry updates to accelerate your professional growth with Aspirely AI's expert blog." />
         <meta name="twitter:image" content="https://aspirely.ai/aspirely-social-preview-updated.png" />
        
        {/* JSON-LD Structured Data */}
         <script type="application/ld+json">
           {JSON.stringify({
             "@context": "https://schema.org",
             "@type": ["Blog", "WebSite"],
             "name": "Aspirely AI Blog",
             "description": "Career insights, job search strategies, interview tips, and industry updates to accelerate your professional growth",
             "url": "https://aspirely.ai/blogs",
             "publisher": {
               "@type": "Organization",
               "name": "Aspirely AI",
               "url": "https://aspirely.ai",
               "logo": {
                 "@type": "ImageObject",
                 "url": "https://aspirely.ai/aspirely-social-preview-updated.png"
               }
             },
             "breadcrumb": {
               "@type": "BreadcrumbList",
               "itemListElement": [
                 {
                   "@type": "ListItem",
                   "position": 1,
                   "name": "Home",
                   "item": "https://aspirely.ai"
                 },
                 {
                   "@type": "ListItem",
                   "position": 2,
                   "name": "Blog",
                   "item": "https://aspirely.ai/blogs"
                 }
               ]
             },
             "blogPost": blogs.map(blog => ({
               "@type": "BlogPosting",
               "headline": blog.title,
               "url": `https://aspirely.ai/blog/${blog.slug}`,
               "datePublished": blog.published_at,
               "author": {
                 "@type": "Person",
                 "name": blog.author_name
               },
               "image": blog.thumbnail_url || "https://aspirely.ai/aspirely-social-preview-updated.png"
             })),
             "mainEntity": {
               "@type": "ItemList",
               "itemListElement": blogs.slice(0, 10).map((blog, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "BlogPosting",
                  "headline": blog.title,
                  "description": blog.excerpt,
                  "url": `https://aspirely.ai/blog/${blog.slug}`,
                  "datePublished": blog.published_at,
                  "author": {
                    "@type": "Person",
                    "name": blog.author_name
                  }
                }
              }))
            }
          })}
        </script>
      </Helmet>
      
      {/* Back to Home Button */}
      <div className="pt-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-gray-800 dark:text-cyan-300 hover:text-gray-900 dark:hover:text-cyan-200 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="pb-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-cyan-300 dark:via-cyan-200 dark:to-cyan-100 bg-clip-text text-transparent">Our Blogs</h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Insights, tips, and industry updates to help you excel in your career journey
          </p>
          
          {/* Search and Filter */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input type="text" placeholder="Search blogs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-card border-border text-foreground placeholder-muted-foreground" />
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                onClick={() => setSelectedTag(null)} 
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !selectedTag 
                    ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-white' 
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                All ({blogs.length})
              </button>
              
              {displayedTags.map(({ tag, count }) => (
                <button 
                  key={tag} 
                  onClick={() => setSelectedTag(tag)} 
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTag === tag 
                      ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-white' 
                      : 'bg-card border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {tag} ({count})
                </button>
              ))}
              
              {!showAllTags && tagCounts.length > 8 && (
                <button
                  onClick={() => setShowAllTags(true)}
                  className="px-3 py-1 rounded-full text-sm bg-card border border-border text-foreground hover:bg-muted transition-colors"
                >
                  +{tagCounts.length - 8} more
                </button>
              )}
              
              {showAllTags && tagCounts.length > 8 && (
                <button
                  onClick={() => setShowAllTags(false)}
                  className="px-3 py-1 rounded-full text-sm bg-card border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4 rounded-full ml-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/5" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">No blogs found matching your criteria.</p>
            </div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
              {filteredBlogs.map(blog => <Card key={blog.id} className="bg-card border-border hover:border-cyan-500/50 dark:hover:border-cyan-400/50 transition-colors">
                  <Link to={`/blog/${blog.slug}`} onClick={() => window.scrollTo(0, 0)}>
                    {blog.thumbnail_url && <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                        <img src={blog.thumbnail_url} alt={`${blog.title} - ${blog.excerpt?.substring(0, 100) || 'Blog post cover image'}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>}
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(blog.published_at)}
                        <User className="w-4 h-4 ml-2" />
                        {blog.author_name}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                        {blog.title}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{blog.excerpt}</p>
                      {blog.tags && blog.tags.length > 0 && <div className="flex flex-wrap gap-2">
                          {blog.tags.map(tag => <Badge key={tag} variant="secondary" className="text-muted-foreground">
                              {tag}
                            </Badge>)}
                        </div>}
                    </CardContent>
                  </Link>
                </Card>)}
            </div>}
        </div>
      </div>

      <Footer />
    </div>;
};
export default Blogs;