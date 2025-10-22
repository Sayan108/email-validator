import SMTPConnection from "smtp-connection";
import dns from "dns/promises";
import validator from "validator";
import {
  DISPOSABLE_DOMAINS,
  ValidationResult,
} from "../types/validation.types";

export class EmailValidationService {
  static async validateEmail(
    email: string,
    opts: { smtpProbe?: boolean; timeoutMs?: number } = {}
  ): Promise<ValidationResult> {
    const timeoutMs = opts.timeoutMs ?? 5000;
    const res: ValidationResult = {
      email,
      syntacticallyValid: false,
      domainHasMX: null,
      spf: null,
      dmarc: null,
      disposable: null,
      smtpCheck: null,
      reason: null,
    };

    // Syntax check
    res.syntacticallyValid = validator.isEmail(email, {
      allow_utf8_local_part: false,
    });
    if (!res.syntacticallyValid) {
      res.reason = "Invalid email syntax";
      return res;
    }

    const domain = email.split("@")[1].toLowerCase();
    res.disposable = DISPOSABLE_DOMAINS.includes(domain);

    // MX lookup
    try {
      const mxRecords = await dns.resolveMx(domain);
      res.domainHasMX = mxRecords.length > 0;
    } catch {
      res.domainHasMX = false;
    }

    // SPF & DMARC checks
    try {
      const txts = await dns.resolveTxt(domain);
      const joined = txts.map((t) => t.join("")).join(" ");
      res.spf = /v=spf1/i.test(joined);
    } catch {
      res.spf = null;
    }

    try {
      const dmarc = await dns.resolveTxt(`_dmarc.${domain}`);
      res.dmarc = Array.isArray(dmarc) && dmarc.length > 0;
    } catch {
      res.dmarc = false;
    }

    // ✅ Improved SMTP Probe
    if (opts.smtpProbe && res.domainHasMX) {
      try {
        const mxRecords = await dns.resolveMx(domain);
        mxRecords.sort((a, b) => a.priority - b.priority);
        const mxHost = mxRecords[0].exchange;

        const connection = new SMTPConnection({
          host: mxHost,
          port: 25,
          connectionTimeout: timeoutMs,
          greetingTimeout: timeoutMs,
          socketTimeout: timeoutMs,
        });

        await new Promise<void>((resolve, reject) => {
          connection.connect(async (err: any) => {
            if (err) return reject(err);

            connection.send(
              {
                from: "verify@example.com",
                to: email,
              },
              "",
              (err2: any) => {
                if (err2) return reject(err2);
                connection.quit();
                resolve();
              }
            );
          });
        });

        res.smtpCheck = {
          success: true,
          message: `Mailbox appears deliverable at ${mxHost}`,
        };
      } catch (err: any) {
        res.smtpCheck = {
          success: false,
          message: err?.message || "SMTP deliverability check failed",
        };
      }
    }

    return res;
  }
}
