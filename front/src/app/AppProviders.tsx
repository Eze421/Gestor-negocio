import type { PropsWithChildren } from "react";
import { ToastProvider } from "../shared/context/ToastContext";

export function AppProviders({ children }: PropsWithChildren) {
  return <ToastProvider>{children}</ToastProvider>;
}
