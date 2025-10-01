"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextValue = (options: string | ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    opts: ConfirmOptions & { title?: string };
    resolver?: (v: boolean) => void;
  }>({ open: false, opts: { title: "Confirm" } });

  const confirm: ConfirmContextValue = (options) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return new Promise<boolean>((resolve) => {
      setState({ open: true, opts, resolver: resolve });
    });
  };

  const handleClose = (ok: boolean) => {
    if (state.resolver) state.resolver(ok);
    setState({ open: false, opts: { title: "Confirm" } });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Modal */}
      {state.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-800">{state.opts.title || "Confirm"}</h3>
            {state.opts.description && <p className="text-sm text-gray-600 mt-2">{state.opts.description}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => handleClose(false)} className="px-4 py-2 rounded bg-gray-100">{state.opts.cancelText || 'Cancel'}</button>
              <button onClick={() => handleClose(true)} className="px-4 py-2 rounded bg-[#456CBD] text-white">{state.opts.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export default ConfirmProvider;
