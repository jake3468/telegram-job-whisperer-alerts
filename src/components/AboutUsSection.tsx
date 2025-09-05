const AboutUsSection = () => {
  return <section id="about-us" className="bg-background py-4 md:py-6 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Privacy Policy and Terms Notice */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground font-inter font-medium text-xs">
            By using Aspirely.ai, you agree to our{' '}
            <a href="/privacy-policy" className="text-foreground hover:text-primary underline transition-colors font-semibold">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="/terms-of-service" className="text-foreground hover:text-primary underline transition-colors font-semibold">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </section>;
};
export default AboutUsSection;