import React from "react";
import { FinanceProvider } from "@/context/FinanceContext";
import AppShell from "@/components/AppShell";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <FinanceProvider>
            <AppShell>{children}</AppShell>
        </FinanceProvider>
    );
}
