import Script from "next/script";
import { umamiConfig, umamiEnabled } from "../../config/analytics";

export function UmamiScript() {
  if (!umamiEnabled) return null;
  return (
    <Script
      src={umamiConfig.scriptUrl}
      data-website-id={umamiConfig.websiteId}
      data-domains={umamiConfig.domains || undefined}
      data-auto-track="true"
      strategy="afterInteractive"
    />
  );
}
