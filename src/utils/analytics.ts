// Google Analytics 4 Event Tracking Utility
// This file provides functions to track conversions and user actions for Google Analytics

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Enhanced E-commerce Product Categories
export const PRODUCT_CATEGORIES = {
  SUBSCRIPTION: 'subscription',
  CREDIT_PACK: 'credit_pack',
  AI_INTERVIEW: 'ai_interview_pack'
} as const;

// Feature Usage Events
export const FEATURE_EVENTS = {
  JOB_ANALYSIS: 'job_analysis_completed',
  COMPANY_ANALYSIS: 'company_analysis_completed',
  INTERVIEW_PREP: 'interview_prep_completed',
  COVER_LETTER: 'cover_letter_generated',
  LINKEDIN_POST: 'linkedin_post_generated',
  LINKEDIN_IMAGE: 'linkedin_image_generated',
  JOB_ALERT: 'job_alert_created',
  RESUME_PDF: 'resume_pdf_generated',
  AI_INTERVIEW: 'ai_interview_completed'
} as const;

// User Journey Events
export const USER_EVENTS = {
  SIGN_UP: 'sign_up',
  PROFILE_COMPLETED: 'profile_completed',
  FIRST_FEATURE_USE: 'first_feature_use',
  CREDITS_DEPLETED: 'credits_depleted',
  UPGRADE_PROMPT: 'upgrade_prompt_shown'
} as const;

// Check if gtag is available
const isGtagAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Generic event tracking function
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (!isGtagAvailable()) {
    console.log('[Analytics] gtag not available, event not tracked:', eventName, parameters);
    return;
  }
  
  try {
    window.gtag('event', eventName, parameters);
    console.log('[Analytics] Event tracked:', eventName, parameters);
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
};

// Conversion Events

// Track checkout initiation (when user clicks buy/subscribe)
export const trackBeginCheckout = (productId: string, productType: 'subscription' | 'credit_pack', price: number, currency: string = 'USD', credits: number) => {
  trackEvent('begin_checkout', {
    currency,
    value: price,
    items: [{
      item_id: productId,
      item_name: productType === 'subscription' ? `Monthly Subscription (${credits} credits)` : `Credit Pack (${credits} credits)`,
      item_category: PRODUCT_CATEGORIES[productType.toUpperCase() as keyof typeof PRODUCT_CATEGORIES],
      price: price,
      quantity: 1
    }]
  });
};

// Track successful purchase (when user returns from successful checkout)
export const trackPurchase = (productId: string, productType: 'subscription' | 'credit_pack', price: number, transactionId: string, currency: string = 'USD', credits: number) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value: price,
    items: [{
      item_id: productId,
      item_name: productType === 'subscription' ? `Monthly Subscription (${credits} credits)` : `Credit Pack (${credits} credits)`,
      item_category: PRODUCT_CATEGORIES[productType.toUpperCase() as keyof typeof PRODUCT_CATEGORIES],
      price: price,
      quantity: 1
    }]
  });
  
  // Track as conversion
  trackEvent('conversion', {
    event_category: 'ecommerce',
    event_label: productType,
    value: price
  });
};

// User Journey Tracking

// Track user registration/signup
export const trackSignUp = (method: string = 'clerk') => {
  trackEvent(USER_EVENTS.SIGN_UP, {
    method
  });
};

// Track profile completion
export const trackProfileCompleted = () => {
  trackEvent(USER_EVENTS.PROFILE_COMPLETED, {
    event_category: 'user_engagement',
    event_label: 'profile_setup'
  });
};

// Feature Usage Tracking

// Track feature usage with credit consumption
export const trackFeatureUsage = (featureName: keyof typeof FEATURE_EVENTS, creditsUsed: number, isFirstTime: boolean = false) => {
  const eventName = FEATURE_EVENTS[featureName];
  
  trackEvent(eventName, {
    event_category: 'feature_usage',
    event_label: featureName.toLowerCase(),
    credits_consumed: creditsUsed,
    is_first_time: isFirstTime
  });
  
  // Track first-time feature usage
  if (isFirstTime) {
    trackEvent(USER_EVENTS.FIRST_FEATURE_USE, {
      feature: featureName.toLowerCase(),
      credits_consumed: creditsUsed
    });
  }
};

// Track when user runs out of credits
export const trackCreditsDepletedOrLow = (remainingCredits: number) => {
  if (remainingCredits === 0) {
    trackEvent(USER_EVENTS.CREDITS_DEPLETED, {
      event_category: 'user_engagement',
      event_label: 'no_credits'
    });
  } else if (remainingCredits <= 5) {
    trackEvent('low_credits_warning', {
      event_category: 'user_engagement',
      event_label: 'low_credits',
      remaining_credits: remainingCredits
    });
  }
};

// Track when upgrade prompts are shown
export const trackUpgradePromptShown = (promptType: 'insufficient_credits' | 'feature_limit' | 'general') => {
  trackEvent(USER_EVENTS.UPGRADE_PROMPT, {
    event_category: 'conversion_funnel',
    event_label: promptType
  });
};

// Custom Business Metrics

// Track credit consumption patterns
export const trackCreditConsumption = (featureName: string, creditsUsed: number, remainingCredits: number) => {
  trackEvent('credit_consumption', {
    event_category: 'business_metrics',
    feature: featureName,
    credits_used: creditsUsed,
    credits_remaining: remainingCredits
  });
};

// Track user engagement level
export const trackUserEngagement = (sessionDuration: number, featuresUsed: number, creditsConsumed: number) => {
  trackEvent('user_engagement_session', {
    event_category: 'user_behavior',
    session_duration: sessionDuration,
    features_used: featuresUsed,
    credits_consumed: creditsConsumed
  });
};

// Track subscription cancellation
export const trackSubscriptionCancelled = (reason?: string) => {
  trackEvent('subscription_cancelled', {
    event_category: 'subscription',
    event_label: reason || 'unknown'
  });
};

// Enhanced E-commerce Tracking

// Track when user views pricing page
export const trackViewPricing = () => {
  trackEvent('view_item_list', {
    item_list_id: 'pricing_plans',
    item_list_name: 'Pricing Plans'
  });
};

// Track when user adds item to cart (begins checkout process)
export const trackAddToCart = (productId: string, productType: 'subscription' | 'credit_pack', price: number, currency: string = 'USD') => {
  trackEvent('add_to_cart', {
    currency,
    value: price,
    items: [{
      item_id: productId,
      item_name: productType === 'subscription' ? 'Monthly Subscription' : 'Credit Pack',
      item_category: PRODUCT_CATEGORIES[productType.toUpperCase() as keyof typeof PRODUCT_CATEGORIES],
      price: price,
      quantity: 1
    }]
  });
};

// Audience and Remarketing

// Track high-value users for remarketing
export const trackHighValueUser = (totalSpent: number, featuresUsed: string[]) => {
  trackEvent('high_value_user', {
    event_category: 'user_segmentation',
    total_spent: totalSpent,
    features_count: featuresUsed.length,
    features_list: featuresUsed.join(',')
  });
};

// Track user returning after signup
export const trackUserReturn = (daysSinceSignup: number) => {
  trackEvent('user_return', {
    event_category: 'user_retention',
    days_since_signup: daysSinceSignup
  });
};

// Custom Conversion Goals

// Track when user completes onboarding
export const trackOnboardingCompleted = () => {
  trackEvent('onboarding_completed', {
    event_category: 'conversion',
    event_label: 'onboarding_funnel'
  });
};

// Track feature adoption
export const trackFeatureAdoption = (featureName: string, adoptionDay: number) => {
  trackEvent('feature_adoption', {
    event_category: 'product_analytics',
    feature: featureName,
    adoption_day: adoptionDay
  });
};

// Export all tracking functions for easy access
export const Analytics = {
  // Core tracking
  trackEvent,
  
  // E-commerce
  trackBeginCheckout,
  trackPurchase,
  trackViewPricing,
  trackAddToCart,
  
  // User journey
  trackSignUp,
  trackProfileCompleted,
  trackOnboardingCompleted,
  
  // Feature usage
  trackFeatureUsage,
  trackCreditConsumption,
  trackCreditsDepletedOrLow,
  
  // Business metrics
  trackUpgradePromptShown,
  trackUserEngagement,
  trackSubscriptionCancelled,
  trackHighValueUser,
  trackUserReturn,
  trackFeatureAdoption
};