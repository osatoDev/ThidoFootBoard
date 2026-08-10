import { Check, Crown, X } from "lucide-react";
import { useRef } from "react";

import { useDialogAccessibility } from "../../hooks/useDialogAccessibility";
import type { SubscriptionPlan } from "../../subscription";
import { trackFeature } from "../../pendo";
import styles from "./PricingModal.module.css";

type PricingModalProps = {
  isLocalhost: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  plan: SubscriptionPlan;
};

const freeFeatures = ["Build and edit lineups", "Paste lineup text", "Import CSV or JSON", "Save lineups locally"];
const premiumFeatures = [
  "Everything in Free",
  "Upload lineup screenshots",
  "Find confirmed match lineups with AI",
  "Early access to premium tools",
];

export function PricingModal({ isLocalhost, onClose, onSelectPlan, plan }: PricingModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useDialogAccessibility(dialogRef, closeButtonRef, onClose);

  function choosePremium() {
    onSelectPlan("premium");
    trackFeature("subscription_plan_selected", { plan: "premium" });
    onClose();
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <section
        aria-labelledby="pricing-title"
        aria-modal="true"
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header>
          <div>
            <span>Plans</span>
            <h2 id="pricing-title">Choose how you build</h2>
            <p>Start free and unlock faster lineup imports when you need them.</p>
          </div>
          <button aria-label="Close pricing" className={styles.closeButton} onClick={onClose} ref={closeButtonRef} type="button">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.plans}>
          <article className={styles.planCard}>
            <div className={styles.planHeading}>
              <div>
                <span>Free</span>
                <strong>$0</strong>
              </div>
              {plan === "free" && !isLocalhost ? <em>Current plan</em> : null}
            </div>
            <p>For building lineups manually or from structured data.</p>
            <ul>
              {freeFeatures.map((feature) => (
                <li key={feature}>
                  <Check size={16} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={styles.secondaryButton}
              disabled={plan === "free"}
              onClick={() => {
                onSelectPlan("free");
                trackFeature("subscription_plan_selected", { plan: "free" });
              }}
              type="button"
            >
              {plan === "free" ? "Current plan" : "Switch to Free"}
            </button>
          </article>

          <article className={`${styles.planCard} ${styles.premiumCard}`}>
            <div className={styles.popularBadge}>
              <Crown size={14} aria-hidden="true" />
              Premium
            </div>
            <div className={styles.planHeading}>
              <div>
                <span>Premium</span>
                <strong>
                  $4.99 <small>/ month</small>
                </strong>
              </div>
              {plan === "premium" || isLocalhost ? <em>{isLocalhost ? "Dev access" : "Current plan"}</em> : null}
            </div>
            <p>For users who want to build lineups from match screenshots.</p>
            <ul>
              {premiumFeatures.map((feature) => (
                <li key={feature}>
                  <Check size={16} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={styles.primaryButton}
              disabled={plan === "premium" || isLocalhost}
              onClick={choosePremium}
              type="button"
            >
              {isLocalhost ? "Premium enabled locally" : plan === "premium" ? "Current plan" : "Upgrade to Premium"}
            </button>
          </article>
        </div>

        <p className={styles.billingNote}>
          Premium activation is stored in this browser while billing and user accounts are being connected.
        </p>
      </section>
    </div>
  );
}
