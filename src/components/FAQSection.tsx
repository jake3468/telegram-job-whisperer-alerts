import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const FAQSection = () => {
  const faqs = [{
    question: "What is Aspirely.ai and how does it work?",
    answer: "Aspirely.ai is an AI-powered job hunting toolkit that automates the boring parts of job searching. We help you create personalized cover letters, prepare for interviews through our AI mock phone call system with Grace, analyze job postings and companies, generate LinkedIn content, organize your applications with our Job Tracker, browse opportunities on our Job Board, and send you daily job alerts via Telegram. Our AI tools use advanced models like OpenAI, Claude, and Perplexity to provide highly personalized results based on your resume and preferences."
  }, {
    question: "How much does Aspirely.ai cost?",
    answer: "We offer a free plan with 10 credits per month to get you started. For users who need more, we have flexible monthly subscription plans and credit packs. All our pricing is transparent with no hidden fees, and we offer refunds within 48 hours if you're not satisfied. Premium users also get priority support."
  }, {
    question: "What AI tools and features are available?",
    answer: "Aspirely.ai offers 10 main features: (1) Telegram Job Alerts with personalized job matching and one-click access to resumes and cover letters, (2) Job Board for centralized job browsing and management, (3) Job Tracker for application organization with AI-powered checklists, (4) AI Mock Phone Call Interview with Grace for realistic practice and feedback reports, (5) Job Analysis for detailed job posting insights, (6) Company Decoder for comprehensive company research, (7) Interview Prep with tailored questions and tips, (8) Cover Letter generation, (9) LinkedIn Post creation with image suggestions, and (10) Telegram Resume Bot for instant resume updates. All tools are powered by leading AI models and provide downloadable results."
  }, {
    question: "Is my data safe and private with Aspirely.ai?",
    answer: "Yes, we take data privacy seriously. We only collect necessary information like your email, resume content, and job preferences to provide personalized results. We use secure encryption for all data transfers and storage. While we share data with AI services like OpenAI and Claude to generate your content, we have strict data processing agreements in place. You own all generated content and can delete your account anytime, which will remove all your data within 30 days."
  }, {
    question: "How do I get started and what support is available?",
    answer: "Getting started is easy! Simply create your free account with 10 credits, upload your resume and preferences in your profile, and start using any of our AI tools. If you need help, our support team responds within 48 hours at support@aspirely.ai. We handle all types of inquiries and provide priority support for premium users. You can also access our tools via Telegram bots for job alerts and resume updates."
  }];
  return <section className="py-12 md:py-16 px-4 bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text mb-2 font-inter text-gray-50">Frequently Asked Questions (FAQ)</h2>
          <p className="text-gray-300 text-lg font-inter">
            Everything you need to know about Aspirely.ai
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-sm">
              <AccordionTrigger className="px-4 py-3 text-left text-white hover:text-sky-400 transition-colors font-inter font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-300 leading-relaxed font-inter">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>)}
        </Accordion>
      </div>
    </section>;
};
export default FAQSection;