// The demo app's template list (packages/demo/src/templates/index.ts) without its ?raw source imports. Written by corpus/sync.mjs.
import WelcomeEmail from "./WelcomeEmail";
import TeamInvite from "./TeamInvite";
import OrderConfirmation from "./OrderConfirmation";
import ReviewRequest from "./ReviewRequest";
import PasswordReset from "./PasswordReset";
import NewsletterDigest from "./NewsletterDigest";
import NewsletterWebArchive from "./NewsletterWebArchive";
import AbandonedCart from "./AbandonedCart";
import ShippingUpdate from "./ShippingUpdate";
import ProductLaunch from "./ProductLaunch";
import VerificationCode from "./VerificationCode";
import UsageReport from "./UsageReport";
import InvoiceReceipt from "./InvoiceReceipt";

export const templates = [
  { id: "welcome", component: WelcomeEmail, mode: null },
  { id: "team-invite", component: TeamInvite, mode: null },
  { id: "order-confirmation", component: OrderConfirmation, mode: null },
  { id: "review-request", component: ReviewRequest, mode: null },
  { id: "password-reset", component: PasswordReset, mode: null },
  { id: "newsletter-digest", component: NewsletterDigest, mode: null },
  { id: "newsletter-web-archive", component: NewsletterWebArchive, mode: "web" },
  { id: "abandoned-cart", component: AbandonedCart, mode: null },
  { id: "shipping-update", component: ShippingUpdate, mode: null },
  { id: "product-launch", component: ProductLaunch, mode: null },
  { id: "verification-code", component: VerificationCode, mode: null },
  { id: "usage-report", component: UsageReport, mode: null },
  { id: "invoice-receipt", component: InvoiceReceipt, mode: "document" },
];
