import "./globals.css";

export const metadata = {
  title: "TableLark Restaurant Finder",
  description:
    "Find nearby, popular, and hidden-gem restaurants on an interactive map.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
