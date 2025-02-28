import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Interactive Roadmap",
  description:
    "An interactive learning roadmap with progress tracking and animations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
