import { Router } from "express";
import { EmailValidationController } from "../controller/emailvalidator.controller";

const router = Router();

router.post("/single", EmailValidationController.validateSingle);
router.post("/bulk", EmailValidationController.validateBulk);

export default router;
