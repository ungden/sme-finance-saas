import React from "react";
import { FinanceProvider } from "@/context/FinanceContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
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
                <AppShell>
                    <ErrorBoundary>{children}</ErrorBoundary>
                </AppShell>
            </FinanceProvider>
        </WorkspaceProvider>
    );
}
