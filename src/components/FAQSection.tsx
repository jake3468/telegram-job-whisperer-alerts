import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const FAQSection = () => {
  const faqs = [{
    question: "What is Aspirely.ai and how does it work?",
    answer: "Aspirely.ai is an AI-powered job hunting toolkit that automates the boring parts of job searching. We help you create personalized cover letters, prepare for interviews through our AI mock phone call system with Grace, analyze job postings and companies, generate LinkedIn content, organize your applications with our Job Tracker, browse opportunities on our Job Board, and send you daily job alerts via Telegram. Our AI tools use advanced models like OpenAI, Claude, and Perplexity to provide highly personalized results based on your resume and preferences."
  }, {
    question: "How much does Aspirely.ai cost?",
    answer: "Get started with our Trial Plan featuring 30 credits. For users who need more, upgrade anytime with the 200-credit Power Pack for extensive usage. All our pricing is transparent with no hidden fees, and we offer refunds within 48 hours if you're not satisfied. Premium users also get priority support."
  }, {
    question: "What AI tools and features are available?",
    answer: "Aspirely.ai features three powerful Telegram AI Agents: (1) Job Alerts AI Agent - delivers personalized job matching with 7 instant files per alert, (2) Resume Builder AI Agent - conversational resume building and tailoring, and (3) Job Application AI Agent - creates complete application packages for specific jobs. Our key web platform features include: Job Board for centralized job browsing, Job Tracker for application organization with AI checklists, and AI Mock Phone Call Interview with Grace for realistic practice and detailed feedback reports. All tools are powered by leading AI models."
  }, {
    question: "Is my data safe and private with Aspirely.ai?",
    answer: "Yes, we take data privacy seriously. We only collect necessary information like your email, resume content, and job preferences to provide personalized results. We use secure encryption for all data transfers and storage. While we share data with AI services like OpenAI and Claude to generate your content, we have strict data processing agreements in place. You own all generated content and can delete your account anytime, which will remove all your data within 30 days."
  }, {
    question: "How do I get started and what support is available?",
    answer: "Getting started is easy! Simply create your account and purchase the Trial Plan with 30 credits to get started, upload your resume and preferences in your profile, and start using any of our AI tools. If you need help, our support team responds within 48 hours at support@aspirely.ai. We handle all types of inquiries and provide priority support for premium users. You can also access our tools via Telegram bots for job alerts and resume updates."
  }];
  return <section className="py-12 md:py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary bg-clip-text mb-2 font-inter text-foreground">Frequently Asked Questions (FAQs)</h2>
          <p className="text-foreground text-base font-inter leading-relaxed">
            Everything you need to know about Aspirely.ai
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="border border-black dark:border-white rounded-lg bg-card/50 backdrop-blur-sm">
              <AccordionTrigger className="px-4 py-3 text-left text-foreground hover:text-primary transition-colors font-inter font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-foreground leading-relaxed font-inter text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>)}
        </Accordion>
      </div>
    </section>;
};
export default FAQSection;