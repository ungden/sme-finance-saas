import React from "react";
import { FinanceProvider } from "@/context/FinanceContext";
import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <FinanceProvider>
            <AppShell>
                <ErrorBoundary>{children}</ErrorBoundary>
            </AppShell>
        </FinanceProvider>
    );
}
