import { Helmet } from 'react-helmet-async';
import AuthHeader from '@/components/AuthHeader';
import Footer from '@/components/Footer';
import { BookOpen, CheckCircle, Gift, Lightbulb } from 'lucide-react';

const Ebook = () => {
  const insideBookPoints = [
    "The 15 roles most at risk of disruption (and how to adapt if yours is on the list)",
    "Practical ChatGPT techniques to enhance your productivity and decision-making",
    "High-value skills that companies are actively hiring for today",
    "A step-by-step 90-day plan to accelerate your career growth",
    "Proven ways to build additional income streams that safeguard your future",
    "Networking approaches that open doors to better opportunities",
    "A 5-year roadmap to position yourself as a leader in your field"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <Helmet>
        <title>Jobs That Will Vanish by 2030 - E-book | Aspirely AI</title>
        <meta 
          name="description" 
          content="Future-proof your career in an AI-driven world. Get 8 strategies to save your career before AI takes over. Download the insider's guide now." 
        />
        <meta name="keywords" content="AI career guide, jobs automation, future-proof career, AI job displacement, career strategies 2030" />
        <link rel="canonical" href="https://aspirely.ai/ebook" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Jobs That Will Vanish by 2030 - E-book | Aspirely AI" />
        <meta property="og:description" content="Future-proof your career in an AI-driven world. Get 8 strategies to save your career before AI takes over." />
        <meta property="og:url" content="https://aspirely.ai/ebook" />
        <meta property="og:type" content="product" />
        <meta property="og:image" content="https://aspirely.ai/lovable-uploads/ebook-cover-jobs-vanish-2030.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Jobs That Will Vanish by 2030 - E-book | Aspirely AI" />
        <meta name="twitter:description" content="Future-proof your career in an AI-driven world. Get 8 strategies to save your career before AI takes over." />
        <meta name="twitter:image" content="https://aspirely.ai/lovable-uploads/ebook-cover-jobs-vanish-2030.jpg" />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "name": "JOBS THAT WILL VANISH BY 2030: 8 Strategies to Save Your Career Before AI Takes Over",
            "author": {
              "@type": "Organization",
              "name": "Aspirely AI"
            },
            "description": "Future-proof your career in an AI-driven world. The insider's guide to getting rich while 40% of workers get replaced.",
            "publisher": {
              "@type": "Organization",
              "name": "Aspirely AI"
            },
            "image": "https://aspirely.ai/lovable-uploads/ebook-cover-jobs-vanish-2030.jpg",
            "url": "https://aspirely.ai/ebook"
          })}
        </script>
      </Helmet>

      <AuthHeader showSectionNav={false} />

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Book Cover */}
            <div className="flex justify-center lg:justify-start">
              <img
                src="/lovable-uploads/ebook-cover-jobs-vanish-2030.jpg"
                alt="Jobs That Will Vanish by 2030 - Book Cover"
                className="rounded-xl shadow-2xl max-w-sm w-full"
              />
            </div>

            {/* Title and Intro */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                JOBS THAT WILL VANISH BY 2030
              </h1>
              <p className="text-xl md:text-2xl text-primary font-semibold mb-4">
                8 Strategies to Save Your Career Before AI Takes Over
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                The Insider's Guide to Getting Rich While 40% of Workers Get Replaced
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Written by <span className="font-semibold text-foreground">ASPIRELY.AI</span>
              </p>

              {/* Placeholder for Price and CTA */}
              <div className="p-6 bg-muted/50 rounded-lg border border-border">
                <p className="text-muted-foreground text-center">
                  Price and purchase options coming soon
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-foreground leading-relaxed mb-6">
              Future-proof your career in an AI-driven world. Are you ready to acquire the skills and strategies that will keep you relevant and in demand?
            </p>
            <p className="text-foreground leading-relaxed mb-6">
              If you are a working professional, job seeker, or planning your next career move, this book is designed to help you stay ahead in a rapidly changing job market.
            </p>
            <p className="text-foreground leading-relaxed mb-8">
              Artificial intelligence and automation are reshaping industries worldwide, and by 2030 nearly every profession will be impacted. The opportunities will be enormous for those who prepare, but challenging for those who don't. This book gives you the strategies, skills, and tools you need to remain competitive, relevant, and in-demand.
            </p>
          </div>
        </section>

        {/* Inside the Book Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Inside You'll Discover</h2>
            </div>
            <ul className="space-y-4">
              {insideBookPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why This Book Matters Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Why This Book Matters</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              Unlike generic career guides, this book is built around current workplace trends and real-world case studies. Every strategy is designed to help you not only protect your career but also thrive in the AI-driven economy.
            </p>
          </div>
        </section>

        {/* Bonus Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Bonus for Readers</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              You'll also receive a <span className="font-bold text-primary">50% discount code</span> for all Aspirely.ai purchases, a fast-growing platform designed to help job seekers with AI-powered job alerts, resume tools, and career insights.
            </p>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
          <p className="text-lg text-foreground font-medium">
            Your career is one of your most important investments. This book ensures you are prepared to grow, adapt, and succeed in the decade ahead.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Ebook;
