import type { ReactElement } from "react";

// Template components
import WelcomeEmail from "./WelcomeEmail";
import TeamInvite from "./TeamInvite";
import OrderConfirmation from "./OrderConfirmation";
import ReviewRequest from "./ReviewRequest";
import PasswordReset from "./PasswordReset";
import NewsletterDigest from "./NewsletterDigest";
import AbandonedCart from "./AbandonedCart";
import ShippingUpdate from "./ShippingUpdate";
import ProductLaunch from "./ProductLaunch";
import VerificationCode from "./VerificationCode";
import UsageReport from "./UsageReport";
import InvoiceReceipt from "./InvoiceReceipt";

// Source code via Vite ?raw imports
import welcomeSource from "./WelcomeEmail.tsx?raw";
import teamInviteSource from "./TeamInvite.tsx?raw";
import orderSource from "./OrderConfirmation.tsx?raw";
import reviewSource from "./ReviewRequest.tsx?raw";
import passwordSource from "./PasswordReset.tsx?raw";
import newsletterSource from "./NewsletterDigest.tsx?raw";
import abandonedCartSource from "./AbandonedCart.tsx?raw";
import shippingSource from "./ShippingUpdate.tsx?raw";
import productLaunchSource from "./ProductLaunch.tsx?raw";
import verificationSource from "./VerificationCode.tsx?raw";
import usageReportSource from "./UsageReport.tsx?raw";
import invoiceSource from "./InvoiceReceipt.tsx?raw";

export interface TemplateEntry {
  id: string;
  name: string;
  description: string;
  category: "onboarding" | "transactional" | "notification" | "security" | "marketing" | "ecommerce" | "newsletter" | "saas" | "document";
  inspiration: string;
  colorAccent: string;
  component: () => ReactElement;
  sourceCode: string;
  mode?: "email" | "web" | "document";
}

export const templates: TemplateEntry[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Stripe-inspired onboarding with feature highlights",
    category: "onboarding",
    inspiration: "Stripe",
    colorAccent: "#6366f1",
    component: WelcomeEmail,
    sourceCode: welcomeSource,
  },
  {
    id: "team-invite",
    name: "Team Invite",
    description: "Vercel-inspired dark theme team invitation",
    category: "onboarding",
    inspiration: "Vercel",
    colorAccent: "#ededed",
    component: TeamInvite,
    sourceCode: teamInviteSource,
  },
  {
    id: "order-confirmation",
    name: "Order Confirmation",
    description: "Apple-inspired order receipt with line item table",
    category: "transactional",
    inspiration: "Apple",
    colorAccent: "#0071e3",
    component: OrderConfirmation,
    sourceCode: orderSource,
  },
  {
    id: "review-request",
    name: "Review Request",
    description: "Airbnb-inspired post-stay review prompt",
    category: "notification",
    inspiration: "Airbnb",
    colorAccent: "#ff385c",
    component: ReviewRequest,
    sourceCode: reviewSource,
  },
  {
    id: "password-reset",
    name: "Password Reset",
    description: "Dropbox-inspired security email with reset code",
    category: "security",
    inspiration: "Dropbox",
    colorAccent: "#0061ff",
    component: PasswordReset,
    sourceCode: passwordSource,
  },
  {
    id: "newsletter-digest",
    name: "Newsletter Digest",
    description: "Substack-inspired editorial newsletter with article list",
    category: "newsletter",
    inspiration: "Substack",
    colorAccent: "#e85d04",
    component: NewsletterDigest,
    sourceCode: newsletterSource,
  },
  {
    id: "abandoned-cart",
    name: "Abandoned Cart",
    description: "Shopify-inspired cart recovery with product showcase",
    category: "ecommerce",
    inspiration: "Shopify",
    colorAccent: "#1a1a1a",
    component: AbandonedCart,
    sourceCode: abandonedCartSource,
  },
  {
    id: "shipping-update",
    name: "Shipping Update",
    description: "Amazon-inspired shipment tracking with progress bar",
    category: "ecommerce",
    inspiration: "Amazon",
    colorAccent: "#059669",
    component: ShippingUpdate,
    sourceCode: shippingSource,
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "Arc-inspired dark theme product announcement",
    category: "marketing",
    inspiration: "Arc Browser",
    colorAccent: "#8b5cf6",
    component: ProductLaunch,
    sourceCode: productLaunchSource,
  },
  {
    id: "verification-code",
    name: "Verification Code",
    description: "GitHub-inspired dark theme 2FA verification",
    category: "security",
    inspiration: "GitHub",
    colorAccent: "#58a6ff",
    component: VerificationCode,
    sourceCode: verificationSource,
  },
  {
    id: "usage-report",
    name: "Usage Report",
    description: "Stripe Dashboard-inspired monthly metrics & billing",
    category: "saas",
    inspiration: "Stripe Dashboard",
    colorAccent: "#6366f1",
    component: UsageReport,
    sourceCode: usageReportSource,
  },
  {
    id: "invoice-receipt",
    name: "Invoice / Receipt",
    description: "Stripe-inspired print-ready invoice for PDF generation",
    category: "document",
    inspiration: "Stripe Invoicing",
    colorAccent: "#635bff",
    component: InvoiceReceipt,
    sourceCode: invoiceSource,
    mode: "document",
  },
];

export const templateMap = Object.fromEntries(
  templates.map((t) => [t.id, t])
);
