import "./globals.css";

export const metadata = {
  title: "TableLark Restaurant Finder",
  applicationName: "TableLark",
  description:
    "Find nearby, popular, and hidden-gem restaurants on an interactive map.",
  icons: {
    icon: [
      {
        url: "/tablelark-favicon-64.png",
        sizes: "64x64",
        type: "image/png",
      },
      {
        url: "/tablelark-favicon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: "/tablelark-favicon-64.png",
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
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
