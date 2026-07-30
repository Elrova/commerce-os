import type { ReactNode } from "react";

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-[#4f504a]">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        minLength={type === "password" ? 8 : undefined}
        className="mt-2 h-11 w-full rounded-xl border border-[#dedcd4] bg-white px-3.5 text-sm outline-none transition-colors placeholder:text-[#b0b1aa] focus:border-[#829078] focus:ring-2 focus:ring-[#829078]/15"
      />
    </div>
  );
}

export function AuthNotice({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "error" | "success";
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-xl border border-[#ead8d3] bg-[#f5eae7] px-3.5 py-3 text-xs leading-5 text-[#87574d]"
          : "rounded-xl border border-[#dbe3d7] bg-[#edf2ea] px-3.5 py-3 text-xs leading-5 text-[#596b53]"
      }
    >
      {children}
    </p>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="flex h-11 w-full items-center justify-center rounded-xl bg-[#20211d] px-4 text-sm font-medium text-white transition-colors hover:bg-[#383a34]"
    >
      {children}
    </button>
  );
}
