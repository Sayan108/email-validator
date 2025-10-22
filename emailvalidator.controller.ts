import { Request, Response } from "express";

import pLimit from "p-limit";
import { EmailValidationService } from "../services/emailvalidator.services";

export class EmailValidationController {
  static async validateSingle(req: Request, res: Response) {
    try {
      const email: string = req.body.email;
      console.log("Received email for validation:", req.body);
      const smtpProbe: boolean = !!req.body.smtpProbe;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const result = await EmailValidationService.validateEmail(email, {
        smtpProbe,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async validateBulk(req: Request, res: Response) {
    try {
      const emails: string[] = req.body.emails;
      const smtpProbe: boolean = !!req.body.smtpProbe;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ error: "Emails array is required" });
      }

      const limit = pLimit(100);
      const results = await Promise.all(
        emails.map((email) =>
          limit(() =>
            EmailValidationService.validateEmail(email, { smtpProbe })
          )
        )
      );

      res.json({ count: results.length, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
