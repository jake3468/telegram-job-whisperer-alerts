
import { logger } from './logger';
import { Environment } from './environment';

interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

class CorsValidator {
  private config: CorsConfig;

  constructor() {
    this.config = {
      allowedOrigins: Environment.isProduction() 
        ? ['https://aspirely.ai', 'https://www.aspirely.ai']
        : ['http://localhost:5173', 'https://lovable.app', 'https://aspirely.lovable.app'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin'
      ],
      credentials: true
    };
  }

  validateOrigin(origin: string): boolean {
    if (!origin) return false;

    const isAllowed = this.config.allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });

    if (!isAllowed) {
      logger.warn('CORS violation detected', { origin, allowedOrigins: this.config.allowedOrigins });
    }

    return isAllowed;
  }

  validateMethod(method: string): boolean {
    return this.config.allowedMethods.includes(method.toUpperCase());
  }

  validateHeaders(headers: string[]): boolean {
    return headers.every(header => 
      this.config.allowedHeaders.includes(header) ||
      header.toLowerCase().startsWith('x-custom-')
    );
  }

  getCorsHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': this.config.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': this.config.allowedHeaders.join(', '),
      'Access-Control-Max-Age': '86400'
    };

    if (origin && this.validateOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      if (this.config.credentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
      }
    }

    return headers;
  }
}

export const corsValidator = new CorsValidator();
