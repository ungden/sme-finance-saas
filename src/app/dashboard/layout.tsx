import React from "react";
import { FinanceProvider } from "@/context/FinanceContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { FinanceOSProvider } from "@/context/FinanceOSContext";
import { ERPProvider } from "@/context/ERPContext";
import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <WorkspaceProvider>
            <FinanceProvider>
                <FinanceOSProvider>
                    <ERPProvider>
                        <AppShell>
                            <ErrorBoundary>{children}</ErrorBoundary>
                        </AppShell>
                    </ERPProvider>
                </FinanceOSProvider>
            </FinanceProvider>
        </WorkspaceProvider>
    );
}
