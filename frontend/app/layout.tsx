import { WebSocketProvider } from "@/context/WebSocketContext";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-[#09090b] text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#09090b] to-[#09090b]">
        <WebSocketProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto bg-transparent">{children}</main>
        </WebSocketProvider>
      </body>
    </html>
  );
}