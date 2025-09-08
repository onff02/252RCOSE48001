"use client";
import React from "react";

type Props = {
  formId: string;
  confirmMessage: string;
  children?: React.ReactNode;
  className?: string;
};

export function ConfirmSubmit({ formId, confirmMessage, children, className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (confirm(confirmMessage)) {
          const form = document.getElementById(formId) as HTMLFormElement | null;
          form?.requestSubmit();
        }
      }}
    >
      {children}
    </button>
  );
}


