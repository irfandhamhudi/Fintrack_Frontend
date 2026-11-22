import { createContext, useContext, useState, type ReactNode } from "react";
import type { EntryType } from "../lib/types";
export type AlertTone = "success" | "error" | "warning" | "info";
export type ModalKind =
  | "transaction"
  | "wallet"
  | "category"
  | "budget"
  | "goal"
  | "allocation"
  | "recurring";
export interface ModalSelection {
  kind: ModalKind;
  id?: string;
  type?: EntryType;
  walletId?: string;
}
interface UI {
  modal: ModalSelection | null;
  open: (selection: ModalSelection) => void;
  updateModal: (selection: Partial<ModalSelection>) => void;
  selectedWalletId: string;
  setSelectedWalletId: (id: string) => void;
  close: () => void;
  toast: { message: string; tone: AlertTone } | null;
  confirm: { message: string; resolve: (value: boolean) => void } | null;
  notify: (message: string, tone?: AlertTone) => void;
  askConfirm: (message: string) => Promise<boolean>;
}
const Context = createContext<UI | null>(null);
export function UiProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalSelection | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState("ALL");
  const [toast, setToast] = useState<{
    message: string;
    tone: AlertTone;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);
  return (
    <Context.Provider
      value={{
        modal,
        open: setModal,
        updateModal: (selection) =>
          setModal((current) =>
            current ? { ...current, ...selection } : current,
          ),
        selectedWalletId,
        setSelectedWalletId,
        close: () => setModal(null),
        toast,
        confirm,
        notify: (message, tone = "success") =>
          setToast(message ? { message, tone } : null),
         askConfirm: (message) =>
           new Promise((resolve) =>
             setConfirm({
               message,
               resolve: (value) => {
                 setConfirm(null);
                 resolve(value);
               },
             }),
           ),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useUi = () => {
  const c = useContext(Context);
  if (!c) throw Error("UiProvider missing");
  return c;
};
