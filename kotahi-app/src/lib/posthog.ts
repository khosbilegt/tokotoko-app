import posthog from "posthog-js";

export const initPostHog = () => {
  if (typeof window !== "undefined") {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    // Always log debug info in production to help troubleshoot
    console.log("PostHog Debug:", {
      hasKey: !!posthogKey,
      keyLength: posthogKey?.length || 0,
      keyPreview: posthogKey ? `${posthogKey.substring(0, 10)}...` : "none",
      hasHost: !!posthogHost,
      host: posthogHost,
      environment: process.env.NODE_ENV,
      allEnvVars: Object.keys(process.env).filter((key) =>
        key.includes("POSTHOG")
      ),
    });

    if (posthogKey && posthogHost) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: "identified_only",
        capture_pageview: true, // Enable automatic pageview capture
        capture_pageleave: true,
        autocapture: true, // Enable automatic event capture
        capture_performance: true, // Track performance metrics
        capture_heatmaps: true, // Enable heatmaps
        loaded: (posthog) => {
          console.log("PostHog loaded successfully", {
            distinctId: posthog.get_distinct_id(),
            isLoaded: posthog.__loaded,
          });

          // Track initial pageview
          posthog.capture("$pageview");
          console.log("PostHog: Initial pageview captured");

          // Track app initialization
          posthog.capture("$app_initialized", {
            app_name: "Kotahi",
            app_version: "1.0.0",
            platform: "web",
          });
          console.log("PostHog: App initialization event captured");
        },
      });
    } else {
      console.warn("PostHog not initialized: Missing environment variables", {
        missingKey: !posthogKey,
        missingHost: !posthogHost,
      });
    }
  }
};

export { posthog };
