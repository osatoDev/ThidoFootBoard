import { useMemo, useState } from "react";

export type SubscriptionPlan = "free" | "premium";

const SUBSCRIPTION_STORAGE_KEY = "thido-subscription-plan";

function loadSubscriptionPlan(): SubscriptionPlan {
  try {
    return window.localStorage.getItem(SUBSCRIPTION_STORAGE_KEY) === "premium" ? "premium" : "free";
  } catch {
    return "free";
  }
}

export function useSubscription() {
  const [plan, setPlanState] = useState<SubscriptionPlan>(loadSubscriptionPlan);
  const isLocalhost = useMemo(() => {
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  }, []);

  function setPlan(nextPlan: SubscriptionPlan) {
    setPlanState(nextPlan);
    window.localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, nextPlan);
  }

  return {
    hasPremiumAccess: plan === "premium" || isLocalhost,
    isLocalhost,
    plan,
    setPlan,
  };
}
