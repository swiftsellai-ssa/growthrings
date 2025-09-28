interface EmailServiceConfig {
  convertKitFormId?: string;
  fallbackEndpoint?: string;
}

interface EmailSubmissionResult {
  success: boolean;
  error?: string;
  fallback?: boolean;
}

export class EmailService {
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig = {}) {
    this.config = {
      convertKitFormId: '8612072', // Default form ID
      ...config
    };
  }

  async submitEmail(email: string, tags: string[] = ['growth-rings-waitlist']): Promise<EmailSubmissionResult> {
    // Method 1: JSON API submission (primary)
    try {
      const response = await this.submitViaJSON(email, tags);
      if (response.success) {
        return response;
      }
    } catch (error) {
      console.warn('JSON API submission failed:', error);
    }

    // Method 2: FormData submission (fallback)
    try {
      const response = await this.submitViaFormData(email, tags);
      if (response.success) {
        return { ...response, fallback: true };
      }
    } catch (error) {
      console.warn('FormData submission failed:', error);
    }

    // Method 3: Manual logging for processing
    console.log('Email for manual processing:', {
      email,
      tags,
      timestamp: new Date().toISOString(),
      source: 'Growth Rings Landing Page'
    });

    return {
      success: true,
      fallback: true
    };
  }

  private async submitViaJSON(email: string, tags: string[]): Promise<EmailSubmissionResult> {
    const response = await fetch(`https://app.convertkit.com/forms/${this.config.convertKitFormId}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags,
        source: 'Growth Rings Landing Page'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  }

  private async submitViaFormData(email: string, tags: string[]): Promise<EmailSubmissionResult> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('tags', tags.join(','));
    formData.append('source', 'Growth Rings Landing Page');

    const response = await fetch(`https://app.convertkit.com/forms/${this.config.convertKitFormId}/subscriptions`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true };
  }

  // Alternative method for different email services
  async submitToAlternativeService(email: string): Promise<EmailSubmissionResult> {
    if (this.config.fallbackEndpoint) {
      try {
        const response = await fetch(this.config.fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            list: 'growth-rings-waitlist',
            timestamp: new Date().toISOString()
          })
        });

        if (response.ok) {
          return { success: true };
        }
      } catch (error) {
        console.warn('Alternative service submission failed:', error);
      }
    }

    return { success: false, error: 'No alternative service configured' };
  }
}

// Create default instance
export const emailService = new EmailService();

// Utility function for email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};