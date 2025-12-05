import { Helmet } from 'react-helmet-async';
import AuthHeader from '@/components/AuthHeader';
import Footer from '@/components/Footer';
import { BookOpen, CheckCircle, Clock, Lightbulb, Mail, Quote } from 'lucide-react';
import { useLocationPricing } from '@/hooks/useLocationPricing';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
const Ebook = () => {
  const {
    pricingData,
    isLoading
  } = useLocationPricing();
  const isIndian = pricingData?.region === 'IN';

  // Countdown timer - ends 3 days from user's first visit (stored in localStorage)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  useEffect(() => {
    const storedEndTime = localStorage.getItem('ebook_offer_end');
    let endTime: number;
    if (storedEndTime) {
      endTime = parseInt(storedEndTime, 10);
    } else {
      // Set offer to expire in 24 hours
      endTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('ebook_offer_end', endTime.toString());
    }
    const calculateTimeLeft = () => {
      const difference = endTime - Date.now();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(difference / (1000 * 60 * 60) % 24),
          minutes: Math.floor(difference / 1000 / 60 % 60),
          seconds: Math.floor(difference / 1000 % 60)
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);
  const ebookPricing = {
    india: {
      originalPrice: '₹249',
      discountedPrice: '₹99',
      checkoutUrl: 'https://checkout.dodopayments.com/buy/pdt_yJ3exEUxmCaf0PLYIdWWj?quantity=1&redirect_url=https://aspirely.ai%2F'
    },
    global: {
      originalPrice: '$9.99',
      discountedPrice: '$3.99',
      checkoutUrl: 'https://checkout.dodopayments.com/buy/pdt_hKlmUz52twLoV4sQnzgkM?quantity=1&redirect_url=https://aspirely.ai%2F'
    }
  };
  const currentPricing = isIndian ? ebookPricing.india : ebookPricing.global;
  const insideBookPoints = ["The 15 roles most at risk of disruption (and how to adapt if yours is on the list)", "Practical ChatGPT techniques to enhance your productivity and decision-making", "High-value skills that companies are actively hiring for today", "A step-by-step 90-day plan to accelerate your career growth", "Proven ways to build additional income streams that safeguard your future", "Networking approaches that open doors to better opportunities", "A 5-year roadmap to position yourself as a leader in your field"];
  const testimonials = [{
    quote: "This book completely changed how I view my career. The 90-day action plan alone was worth 10x the price. I've already started upskilling and feel more confident about my future.",
    name: "Priya S.",
    role: "Marketing Manager",
    location: "Mumbai"
  }, {
    quote: "As someone in accounting, I was worried about AI replacing my job. This book gave me practical strategies to become irreplaceable. Highly recommend!",
    name: "Michael T.",
    role: "Senior Accountant",
    location: "London"
  }, {
    quote: "The chapter on building multiple income streams opened my eyes. I've already implemented two of the strategies and seeing results within weeks.",
    name: "Sarah K.",
    role: "Software Developer",
    location: "San Francisco"
  }];
  const handleBuyNow = () => {
    window.open(currentPricing.checkoutUrl, '_blank');
  };
  const PricingSection = () => <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
      {isLoading ? <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading pricing...</div>
        </div> : <div className="text-center">
          {/* 60% OFF Badge */}
          <span className="inline-block bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full mb-3">
            60% OFF
          </span>
          
          {/* Countdown Timer */}
          <div className="mb-4">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
              <Clock className="w-3 h-3" />
              <span>Offer ends in:</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              {[{
            value: timeLeft.hours,
            label: 'Hours'
          }, {
            value: timeLeft.minutes,
            label: 'Minutes'
          }, {
            value: timeLeft.seconds,
            label: 'Seconds'
          }].map((item, index) => <div key={index} className="flex flex-col items-center">
                  <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-2xl font-bold min-w-[60px] text-center shadow-md">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{item.label}</span>
                </div>)}
            </div>
          </div>
          
          {/* Price Display */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Original Price (strikethrough) */}
            <span className="text-xl text-muted-foreground line-through">
              {currentPricing.originalPrice}
            </span>
            {/* Discounted Price */}
            <span className="text-3xl font-bold text-foreground">
              {currentPricing.discountedPrice}
            </span>
          </div>
          
          {/* Buy Now Button */}
          <Button onClick={handleBuyNow} className="w-full font-semibold py-3 px-8 text-base" size="lg">
            Buy Now
          </Button>
          
          {/* Email Delivery Note */}
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <div className="flex items-center justify-start md:justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span>Instant PDF download link via email</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-left md:text-center">
              Sent from <span className="font-medium">noreply@dodopayments.com</span> (our payment partner Dodopayments)
            </p>
          </div>
        </div>}
    </div>;
  return <div className="min-h-screen bg-background text-foreground font-inter">
      <Helmet>
        <title>Jobs That Will Vanish by 2030 - E-book | Aspirely AI</title>
        <meta name="description" content="Future-proof your career in an AI-driven world. Get 8 strategies to save your career before AI takes over. Download the insider's guide now." />
        <meta name="keywords" content="AI career guide, jobs automation, future-proof career, AI job displacement, career strategies 2030" />
        <link rel="canonical" href="https://aspirely.ai/ebook-jobs-that-will-vanish-by-2030" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Jobs That Will Vanish by 2030 - E-book | Aspirely AI" />
        <meta property="og:description" content="Future-proof your career in an AI-driven world. Get 8 strategies to save your career before AI takes over." />
        <meta property="og:url" content="https://aspirely.ai/ebook-jobs-that-will-vanish-by-2030" />
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
          "url": "https://aspirely.ai/ebook-jobs-that-will-vanish-by-2030"
        })}
        </script>
      </Helmet>

      <AuthHeader showSectionNav={false} />

      <main className="pt-32 lg:pt-36 pb-16">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Title and Intro - Shows first on mobile/tablet */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-3">
                JOBS THAT WILL VANISH BY 2030
              </h1>
              <p className="text-lg md:text-xl text-primary font-semibold mb-3">
                8 Strategies to Save Your Career Before AI Takes Over
              </p>
              <p className="text-base text-muted-foreground mb-4">
                The Insider's Guide to Getting Rich While 40% of Workers Get Replaced
              </p>
              <p className="text-sm text-muted-foreground mb-6 lg:mb-6">
                E-book written by <span className="font-semibold text-foreground">ASPIRELY.AI</span>
              </p>

              {/* Price and CTA - Desktop only */}
              <div className="hidden lg:block">
                <PricingSection />
              </div>
            </div>

            {/* Book Cover - Shows second on mobile/tablet */}
            <div className="flex justify-center order-2 lg:order-1">
              <img src="/lovable-uploads/ebook-cover-jobs-vanish-2030.jpg" alt="Jobs That Will Vanish by 2030 - Book Cover" className="rounded-xl shadow-2xl max-w-[280px] lg:max-w-xs w-full" />
            </div>

            {/* Price and CTA - Mobile/Tablet only (shows below book cover) */}
            <div className="lg:hidden order-3 w-full">
              <PricingSection />
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
          <div className="border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-8 bg-green-200">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Inside You'll Discover</h2>
            </div>
            <ul className="space-y-4">
              {insideBookPoints.map((point, index) => <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </li>)}
            </ul>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">What Readers Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => <div key={index} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-6">
                <Quote className="w-6 h-6 text-primary/40 mb-3" />
                <p className="text-foreground text-sm leading-relaxed mb-4 italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-amber-200/50 dark:border-amber-800/30 pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.location}
                  </p>
                </div>
              </div>)}
          </div>
        </section>

        {/* Why This Book Matters Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Why This Book Matters</h2>
            </div>
            <p className="text-foreground leading-relaxed">
              Unlike generic career guides, this book is built around current workplace trends and real-world case studies. Every strategy is designed to help you not only protect your career but also thrive in the AI-driven economy.
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
    </div>;
};
export default Ebook;