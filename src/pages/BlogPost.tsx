import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Share2, Twitter, Linkedin } from 'lucide-react';

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

  // Static blog data repository
  const blogData: Record<string, Blog> = {
    "navigating-new-h1b-visa-landscape-international-job-seekers": {
      id: "h1b-visa-2025",
      title: "Navigating the New H-1B Visa Landscape: Essential Tips for International Job Seekers",
      slug: "navigating-new-h1b-visa-landscape-international-job-seekers",
      content: `<p>If you're an international professional dreaming of working in the United States, you've likely felt the ground shift beneath your feet recently. The H-1B visa program - long considered the golden gateway for skilled workers has undergone sweeping changes that are reshaping the entire landscape for international job seekers.</p><p>The introduction of a staggering $100,000 annual fee and mandatory in-person interviews represents more than just policy adjustments; they're fundamental shifts that demand new strategies, deeper preparation, and perhaps most importantly, a fresh perspective on how to navigate your American career journey.</p><h2>Understanding the New H-1B Visa Regulations</h2><p>Let's address the elephant in the room: the numbers are daunting. The newly announced $100,000 annual fee isn't just a financial hurdle, it's a strategic redefinition of who gets access to the American job market. Implemented as part of broader immigration policy changes, this fee aims to prioritize American workers while ensuring that companies truly value the international talent they sponsor <a href="https://apnews.com" target="_blank">apnews.com</a>.</p><p>But here's what many headlines miss: this isn't necessarily bad news for highly skilled professionals. Think about it—if employers are willing to invest $100,000 annually in your talent, what does that say about your value proposition? It's forcing a market correction where only the most qualified candidates and the most committed employers will move forward.</p><p>Additionally, starting September 21, 2025, all H-1B applicants must attend in-person interviews at U.S. embassies or consulates, eliminating previous waivers regardless of your history or qualifications <a href="https://visaverge.com" target="_blank">visaverge.com</a>. This change extends processing times and adds logistical complexity, but it also creates opportunities for well-prepared candidates to distinguish themselves through direct interaction with consular officers.</p><h2>Implications for International Job Seekers and Professionals</h2><p>The ripple effects of these changes are already being felt across industries and continents. Small and medium-sized businesses, traditionally more flexible in their hiring practices, are now reconsidering their approach to international talent. The financial burden means they'll likely focus on fewer, higher-impact roles rather than entry-level positions <a href="https://reuters.com" target="_blank">reuters.com</a>.</p><p>For job seekers, this creates a stark reality: the bar has been raised significantly. But here's the opportunity hidden within the challenge, companies that do move forward with H-1B sponsorship are now making a substantial investment in you personally. This could translate to better compensation packages, accelerated career paths, and stronger employer commitment to your long-term success.</p><p>The global response has been telling. India's IT industry body Nasscom has warned of operational disruptions, while South Korea is assessing the impact on its workforce <a href="https://reuters.com" target="_blank">reuters.com</a>. These reactions underscore just how interconnected the global talent market has become—and how your individual strategy needs to account for these macro-level shifts.</p><p>From a practical standpoint, the mandatory in-person interviews are creating bottlenecks at consulates worldwide. Wait times are extending, and the interview process itself requires more preparation than ever before <a href="https://nbcbayarea.com" target="_blank">nbcbayarea.com</a>. This isn't just about paperwork anymore, it's about presenting yourself as an exceptional candidate worthy of significant investment.</p><h2>Key Strategies for Enhancing Your Qualifications</h2><p>Given these new realities, how do you position yourself as an irresistible candidate? The answer lies in strategic skill development and market positioning that goes far beyond traditional resume building.</p><p>First, focus on acquiring specialized expertise in high-demand areas. The $100,000 fee effectively prices out generic skill sets, so you need to become indispensable in your field. This might mean pursuing advanced certifications in emerging technologies, developing niche expertise in regulatory compliance, or mastering cross-functional skills that span multiple departments.</p><p>Consider the changing nature of work itself. Remote and hybrid models have proven that exceptional talent can contribute regardless of location. Use this to your advantage and demonstrate how your international perspective and cross-cultural competencies add unique value that purely domestic talent cannot provide.</p><p>Advanced degrees remain powerful differentiators, but the key is ensuring they align with market demands <a href="https://lawyer-monthly.com" target="_blank">lawyer-monthly.com</a>. Research which specific degree programs and specializations are seeing the highest H-1B approval rates and salary premiums. Sometimes a targeted master's program or professional certification can be more valuable than a traditional advanced degree.</p><p>When researching potential employers, tools like those available at aspirely.ai can help you understand company-specific requirements and cultural fit before you even apply. This kind of targeted preparation becomes crucial when employers are making such significant financial commitments to international hires.</p><h2>Exploring Alternative Visa Options</h2><p>While H-1B remains the most common pathway, savvy international professionals are diversifying their visa strategies. The O-1 visa for individuals with extraordinary abilities is becoming increasingly attractive, especially for those in technology, sciences, or creative fields. Unlike H-1B, O-1 visas aren't subject to annual caps and can be renewed indefinitely.</p><p>The L-1 visa for intra-company transfers offers another strategic pathway, particularly if you can establish a relationship with a multinational company in your home country first. This approach requires longer-term planning but can provide more predictable outcomes <a href="https://goelite.com" target="_blank">goelite.com</a>.</p><p>For entrepreneurs and innovative professionals, the E-2 investor visa or the recently expanded International Entrepreneur Parole program might offer viable alternatives. These options require different types of preparation and investment but can provide pathways that aren't subject to the same restrictions as H-1B.</p><p>Don't overlook the EB-2 National Interest Waiver for professionals whose work benefits the United States. This permanent residency pathway can sometimes be faster than the H-1B to green card process, especially for professionals in healthcare, engineering, or research fields.</p><h2>Staying Updated: The Importance of Informed Applications</h2><p>In this rapidly evolving landscape, information is your most valuable asset. Immigration policies are shifting frequently, and what was true six months ago might no longer apply today. Regular monitoring of USCIS updates and Department of State announcements isn't just recommended—it's essential for strategic planning <a href="https://ovis-intl.dartmouth.edu" target="_blank">ovis-intl.dartmouth.edu</a>.</p><p>But staying informed goes beyond just reading policy updates. You need to understand market trends, industry-specific impacts, and regional variations in implementation. Some consulates are processing applications faster than others, some industries are seeing higher approval rates, and some geographic regions are experiencing different types of challenges.</p><p>Consider joining professional organizations and immigration-focused communities where real-time information sharing happens. LinkedIn groups, industry associations, and immigration attorney networks often provide insights that don't make it into official announcements until much later.</p><p>When preparing applications, thorough company research becomes more critical than ever. Platforms like aspirely.ai can help you understand not just job requirements, but company culture, growth trajectories, and historical patterns with international hires. This depth of preparation can make the difference between a successful application and a costly rejection.</p><h2>Frequently Asked Questions About the H-1B Visa Changes</h2><p><strong>Q: When do the new H-1B fees take effect?</strong><br>The $100,000 annual fee was announced in September 2025 and applies to new H-1B applications moving forward. Existing visa holders aren't immediately impacted, but renewals and transfers will be subject to the new fee structure.</p><p><strong>Q: Can the annual fee be waived for any categories of applicants?</strong><br>Currently, there are no announced waivers or exceptions to the $100,000 annual fee. This applies uniformly across all H-1B categories and employer types.</p><p><strong>Q: How long are the in-person interview wait times?</strong><br>Wait times vary significantly by location and season. Major consulates in India and China are seeing the longest delays, sometimes extending several months. Planning your timeline with significant buffer periods is essential.</p><p><strong>Q: Do these changes affect H-1B extensions and transfers?</strong><br>Yes, both extensions and transfers to new employers will be subject to the new fee structure. However, certain administrative processes may have different requirements than initial applications.</p><p><strong>Q: Are there any grandfather provisions for applications already in process?</strong><br>Applications that were submitted before the policy changes generally continue under the previous rules, but new filings must comply with current requirements. Consult with immigration counsel for specific situations.</p><p><strong>Q: How should I prepare for the mandatory in-person interview?</strong><br>Treat this as seriously as a job interview. Prepare detailed explanations of your role, your employer's business, and how your skills align with U.S. labor market needs. Practice articulating your value proposition clearly and confidently.</p><p>The H-1B landscape has fundamentally changed, but opportunity still exists for those willing to adapt their strategies. The key is approaching this new environment with deeper preparation, more targeted skill development, and a comprehensive understanding of alternative pathways. While the barriers have certainly increased, they've also created opportunities for truly exceptional candidates to distinguish themselves in ways that weren't possible before.</p><p>Success in this new landscape requires more than just meeting minimum requirements—it demands strategic career planning, continuous skill development, and the kind of thorough preparation that demonstrates you're worth a $100,000 annual investment. For those willing to rise to this challenge, the American dream remains very much within reach.</p>`,
      excerpt: "The H-1B visa program has changed dramatically with new $100,000 fees and mandatory in-person interviews. Here's how international professionals can adapt and thrive.",
      thumbnail_url: "https://ik.imagekit.io/xcxe9ubbh/Gemini_Generated_Image_eyyzjoeyyzjoeyyz.png?updatedAt=1758437410692",
      author_name: "Joseph",
      published_at: "2025-01-21T00:00:00Z",
      tags: ["H-1B Visa", "International Job Seekers", "Immigration Policy", "Visa Sponsorship", "Work Authorization"],
      meta_title: "New H-1B Visa Rules 2025: Complete Guide for International Job Seekers",
      meta_description: "Navigate the new H-1B visa landscape with $100K fees and mandatory interviews. Essential strategies and alternatives for international professionals seeking US opportunities."
    },
    "future-skills-based-hiring-2025-essential-skills": {
      id: "skills-based-hiring-2025",
      title: "The Future is Skills: Why 2025 Will Redefine How You Get Hired",
      slug: "future-skills-based-hiring-2025-essential-skills",
      content: `<h2>The Shift to Skills-Based Hiring: Why It's Happening</h2><p>Remember when a college degree was your golden ticket to career success? Those days are rapidly fading. We're witnessing a seismic shift in how employers think about talent — and it's one of the most exciting developments for job seekers in decades.</p><p>Skills-based hiring isn't just a trendy buzzword; it's becoming the new reality. This approach prioritizes what you can actually do over where you went to school or what's printed on your diploma. Think about it: would you rather hire someone who can solve real problems or someone who memorized textbook theories four years ago?</p><p>The numbers tell a compelling story. In 2024, 81% of employers practiced skills-based hiring, up from just 56% in 2022 <a href="https://www.linkedin.com/pulse/skills-based-hiring-future-talent-acquisition-2025-supriya-joshi-peznf" target="_blank">linkedin.com</a>. That's not just growth — that's a revolution.</p><p>What's driving this change? Companies are finally realizing that traditional hiring methods were leaving incredible talent on the table. Bridget Gainer from Aon puts it perfectly: we need to "redefine job requirements to leverage untapped talent" <a href="https://www.ft.com/content/2c2558fe-fc6e-4a92-b54a-c78aede7336b" target="_blank">ft.com</a>. This shift is opening doors for career changers, self-taught professionals, and anyone who's built expertise through non-traditional paths.</p><p>But here's what this really means for you: your next career move depends less on your educational pedigree and more on your ability to demonstrate real, applicable skills. The playing field is leveling, and that's incredibly empowering.</p><h2>Key In-Demand Skills for 2025: What You Need to Know</h2><p>So what skills are employers actually looking for? Let's dive into the capabilities that will make you indispensable in 2025's job market.</p><h3>AI Literacy: Your New Superpower</h3><p>AI literacy goes far beyond knowing how to use ChatGPT. It's about understanding how AI works, when to use it, and — crucially — when not to. This includes grasping machine learning concepts, understanding data flows, and being able to critically evaluate AI outputs <a href="https://en.wikipedia.org/wiki/AI_literacy" target="_blank">en.wikipedia.org</a>.</p><p>Here's the reality: AI isn't replacing jobs as much as it's transforming them. The professionals who thrive will be those who can work alongside AI tools effectively. A fascinating study found that degree requirements for AI roles declined by 15% between 2018 and 2024 <a href="https://arxiv.org/abs/2312.11942" target="_blank">arxiv.org</a> — employers care more about your ability to work with AI than your formal education.</p><h3>Data Analysis: The Universal Language</h3><p>Every industry is drowning in data, but starving for insights. Data analysis isn't just for data scientists anymore — it's becoming as fundamental as basic computer literacy was two decades ago.</p><p>This skill involves more than just spreadsheet manipulation. It's about asking the right questions, cleaning messy data, identifying patterns, and translating findings into actionable business decisions. As one expert noted, data literacy is essential across all job sectors because it enables critical evaluation and effective utilization of information <a href="https://time.com/6290684/data-literacy-us-national-security" target="_blank">time.com</a>.</p><h3>Prompt Engineering: The Art of AI Communication</h3><p>Here's a skill that didn't exist five years ago but is now crucial: prompt engineering. This involves crafting precise inputs to guide AI models toward generating the outputs you actually need <a href="https://www.ft.com/content/a6cb4832-c5be-480d-911c-a9ba92c929d7" target="_blank">ft.com</a>.</p><p>Think of it as learning a new language — one where precision and creativity intersect. The professionals who master prompt engineering can 10x their productivity by effectively leveraging AI tools across writing, analysis, coding, and creative tasks.</p><h2>How to Develop Essential Skills: Practical Tips</h2><p>Knowing what skills you need is only half the battle. The real question is: how do you actually develop them? Let's get practical.</p><h3>Start with Project-Based Learning</h3><p>Forget about collecting certificates — employers want to see what you can build. Choose a real problem in your industry and solve it using the skills you're developing. Building a portfolio of actual work beats theoretical knowledge every time.</p><p>For AI literacy, start by automating a tedious task in your current role. For data analysis, find a dataset related to your field and extract meaningful insights. For prompt engineering, create a series of prompts that could genuinely improve your team's workflow.</p><h3>Embrace the 70-20-10 Learning Model</h3><p>Dedicate 70% of your learning time to hands-on experimentation, 20% to learning from others (mentors, colleagues, online communities), and 10% to formal courses or certifications. This approach mirrors how skills are actually developed in the workplace.</p><h3>Document Your Learning Journey</h3><p>Keep a learning log of what you're building, what challenges you've overcome, and what insights you've gained. This becomes invaluable when discussing your skills with potential employers. They want to hear your thought process, not just your accomplishments.</p><h2>Leveraging AI Tools to Enhance Your Job Search</h2><p>Here's the beautiful irony: as skills-based hiring rises, AI tools are making it easier than ever to demonstrate those skills and find the right opportunities.</p><p>The modern job search isn't just about applying to positions — it's about strategically targeting roles where your skills create maximum value. AI-powered platforms can help you analyze job postings to understand exactly what employers are looking for and how well you match their needs.</p><p>Consider how you might use AI to decode company cultures, predict interview questions based on the specific role and company, or even craft personalized outreach messages that demonstrate your understanding of the business. These aren't just productivity hacks — they're ways to show employers that you can think strategically about leveraging technology.</p><p>Tools like <a href="https://aspirely.ai" target="_blank">Aspirely.ai</a> are pioneering this approach, offering features like job analysis that provides match percentages and specific tips for improving your applications, or company research that gives you deep insights into workplace culture and interview processes. The goal isn't to game the system — it's to find opportunities where your skills genuinely align with business needs.</p><h2>Building a Strong Professional Network in the Digital Age</h2><p>In a skills-based world, your network becomes even more crucial — but the way you build it is changing. It's no longer about collecting connections; it's about demonstrating expertise and building genuine professional relationships.</p><h3>Share Your Learning Process</h3><p>Use platforms like LinkedIn to document your skill development journey. Share insights from projects you're working on, interesting problems you've solved, or tools you've discovered. This positions you as someone who's actively growing and thinking critically about your field.</p><p>The key is consistency and authenticity. Regular posts about your professional growth — even small wins — are more valuable than occasional announcements about major achievements.</p><h3>Engage with Industry Conversations</h3><p>Join discussions about the skills and trends that matter in your field. Comment thoughtfully on posts from industry leaders. Share relevant articles with your perspective. This demonstrates that you're plugged into what's happening and can think critically about industry developments.</p><h3>Offer Value Before Asking for Help</h3><p>The strongest professional relationships are built on mutual value exchange. Look for ways to help others in your network — share relevant opportunities, make helpful introductions, or offer insights from your experience. This creates a foundation of goodwill that benefits everyone involved.</p><p>Remember, networking in the digital age isn't about perfecting an elevator pitch. It's about consistently demonstrating the skills and insights that make you valuable to work with.</p><h2>Your Skills-First Career Strategy</h2><p>The shift to skills-based hiring isn't just changing how companies recruit — it's fundamentally altering how successful careers are built. This is your opportunity to take control of your professional trajectory in ways that weren't possible when degrees dominated hiring decisions.</p><p>The professionals who will thrive in 2025 and beyond are those who embrace continuous learning, focus on building demonstrable capabilities, and can articulate the value they create through their skills. This isn't about chasing every new trend — it's about strategically developing the capabilities that align with both your interests and market demand.</p><p>Start today. Choose one skill from this guide and commit to developing it over the next 90 days. Build something with it. Share what you learn. Connect with others who are solving similar problems. The future belongs to those who can prove what they can do, not just what they studied.</p><p>The question isn't whether skills-based hiring will continue to grow — it's whether you'll be ready when opportunities arise. The tools, resources, and pathways exist. Now it's up to you to use them.</p>`,
      excerpt: "Discover how the job market is shifting from degrees to skills, and learn the essential capabilities you need to thrive in 2025's new hiring landscape.",
      thumbnail_url: "https://ik.imagekit.io/xcxe9ubbh/Yellow%20Freelancer%20YouTube%20Thumbnail.png?updatedAt=1755103645573",
      author_name: "Joseph",
      published_at: "2025-01-10T00:00:00Z",
      tags: ["Skills-Based Hiring", "AI Literacy", "Data Analysis", "Prompt Engineering", "Career Development", "Job Search Strategy", "2025 Job Market"],
      meta_title: "Skills-Based Hiring 2025: Essential Skills for the New Job Market",
      meta_description: "Learn how skills-based hiring is reshaping careers in 2025. Discover essential skills like AI literacy, data analysis, and prompt engineering to boost your job prospects."
    }
  };

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
      
      <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link to="/blogs" className="inline-flex items-center text-sky-400 hover:text-sky-300 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Link>

          {/* Blog Header */}
          <div className="mb-8">
            {blog.thumbnail_url && <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-8 w-full">
                <img src={blog.thumbnail_url} alt={`${blog.title} - Featured image for blog post about ${blog.tags?.join(', ') || 'career development'}`} className="w-full h-full object-cover" />
              </div>}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.published_at)}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {blog.author_name}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-bold mb-6 bg-gradient-to-r from-sky-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent break-words">
              {blog.title}
            </h1>

            {blog.tags && blog.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map(tag => <Badge key={tag} variant="secondary" className="text-gray-300 bg-blue-950 text-xs sm:text-sm">
                    {tag}
                  </Badge>)}
              </div>}

            {/* Share Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-8 border-b border-gray-700">
              <span className="text-gray-400">Share:</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="border-gray-600 bg-blue-500 hover:bg-blue-400 text-zinc-950 text-xs sm:text-sm">
                  <Twitter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')} className="border-gray-600 bg-sky-400 hover:bg-sky-300 text-gray-950 text-xs sm:text-sm">
                  <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="border-gray-600 bg-teal-300 hover:bg-teal-200 text-zinc-950 text-xs sm:text-sm">
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>

          {/* Blog Content */}
          <div className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none overflow-hidden word-wrap break-words">
            {blog.content ? (
              <SafeHTMLRenderer 
                content={blog.content}
                className="text-gray-300 leading-relaxed [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:lg:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mb-4 [&>h2]:mt-8 [&>p]:mb-4 [&>p]:text-base [&>p]:sm:text-lg [&_a]:!text-blue-400 [&_a]:!underline [&_a]:!decoration-blue-400 [&_a]:!underline-offset-2 [&_a]:hover:!text-blue-300 [&_a]:break-words [&_a]:cursor-pointer"
                maxLength={50000}
              />
            ) : (
              <div className="text-gray-400 italic">No content available</div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>;
};
export default BlogPost;