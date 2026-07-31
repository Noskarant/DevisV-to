import { Text } from "@react-email/components";
import type { ReactNode } from "react";

type InfoCardProps = {
  title?: string;
  children: ReactNode;
  tone?: "default" | "success" | "warning";
};

const tones = {
  default: { background: "#eef7f4", border: "#d4e7e1", color: "#244941" },
  success: { background: "#edf8f4", border: "#bfe1d6", color: "#174f45" },
  warning: { background: "#fff7f1", border: "#efd0bf", color: "#7b4531" },
};

export function InfoCard({ title, children, tone = "default" }: InfoCardProps) {
  const palette = tones[tone];

  return (
    <div
      style={{
        backgroundColor: palette.background,
        border: `1px solid ${palette.border}`,
        borderRadius: "14px",
        margin: "22px 0",
        padding: "16px 18px",
      }}
    >
      {title ? (
        <Text
          style={{
            color: palette.color,
            fontSize: "12px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            lineHeight: "18px",
            margin: "0 0 8px",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Text>
      ) : null}
      <div style={{ color: palette.color, fontSize: "14px", lineHeight: "22px" }}>{children}</div>
    </div>
  );
}
