import { ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import Chatbot from "@/components/Chatbot";

interface DashboardLayoutProps {
  role: string;
  links: { to: string; icon: any; label: string }[];
  children: ReactNode;
}

const DashboardLayout = ({ role, links, children }: DashboardLayoutProps) => (
  <div className="min-h-screen bg-background">
    <DashboardSidebar role={role} links={links} />
    <main className="ml-64 min-h-screen p-8">{children}</main>
    <Chatbot />
  </div>
);

export default DashboardLayout;
