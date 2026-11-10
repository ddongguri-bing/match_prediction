import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`mb-3 rounded-[14px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <section className="mb-3 rounded-[14px] bg-white px-4 py-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <p className="text-[15px] font-bold leading-relaxed">{children}</p>
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2.5 mt-2 px-0.5 text-sm font-bold text-sub">{children}</h2>;
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 mt-3 block text-[13px] text-sub">{children}</span>;
}

const fieldClass =
  "w-full rounded-[10px] border-[1.5px] border-line bg-white px-3 py-[11px] text-[15px] outline-none focus:border-brand";

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${fieldClass} ${className}`} {...rest} />;
}

type ButtonVariant = "primary" | "ghost" | "small" | "smallGhost";

const buttonClass: Record<ButtonVariant, string> = {
  primary:
    "w-full rounded-[10px] bg-brand py-[13px] text-[15px] font-bold text-white disabled:opacity-50",
  ghost:
    "w-full rounded-[10px] border-[1.5px] border-line bg-white py-[13px] text-[15px] font-bold text-ink",
  small: "rounded-[10px] bg-brand px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50",
  smallGhost:
    "rounded-[10px] border-[1.5px] border-line bg-white px-3 py-2 text-[13px] font-bold text-ink",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={`${buttonClass[variant]} ${className}`} {...props} />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-2 text-[13px] text-no" role="alert">
      {children}
    </p>
  );
}
