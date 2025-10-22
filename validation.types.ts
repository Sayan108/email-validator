export interface ValidationResult {
  email: string;
  syntacticallyValid: boolean;
  domainHasMX: boolean | null;
  spf?: boolean | null;
  dmarc?: boolean | null;
  disposable?: boolean | null;
  smtpCheck?: {
    success: boolean;
    code?: number;
    message?: string;
  } | null;
  reason?: string | null;
}

export const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "dispostable.com",
];
