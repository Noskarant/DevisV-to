import { Button } from "@react-email/components";

type EmailButtonProps = {
  href: string;
  children: string;
};

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#0c5b50",
        borderRadius: "999px",
        color: "#ffffff",
        display: "inline-block",
        fontSize: "14px",
        fontWeight: 700,
        lineHeight: "20px",
        padding: "13px 22px",
        textDecoration: "none",
      }}
    >
      {children}
    </Button>
  );
}
