"use client";

import { useEffect } from "react";

interface AdSenseUnitProps {
  client: string;
  slot: string;
  format?: string;
  responsive?: boolean;
}

export function AdSenseUnit({
  client,
  slot,
  format = "auto",
  responsive = true,
}: AdSenseUnitProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
