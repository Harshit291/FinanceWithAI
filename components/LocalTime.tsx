"use client";

import { useEffect, useState } from "react";

export function LocalTime({ date }: { date: string | Date }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    try {
      const d = new Date(date);
      setFormatted(
        d.toLocaleString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    } catch (e) {
      setFormatted(String(date));
    }
  }, [date]);

  if (!formatted) {
    // Fallback while rendering on server to avoid hydration mismatch
    return <span>{new Date(date).toISOString().slice(0, 16).replace("T", " ")} UTC</span>;
  }

  return <span>{formatted}</span>;
}
