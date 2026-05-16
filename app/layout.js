import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import SessionProvider from "../components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MultiUploads — Upload Once, Distribute Everywhere",
  description:
    "Upload your video once and distribute it to YouTube, Instagram, TikTok, Facebook & more. AI-powered smart clips, auto-captions, and unified analytics for content creators.",
  keywords: [
    "video upload",
    "multi-platform",
    "content creator",
    "youtube",
    "instagram reels",
    "tiktok",
    "video distribution",
    "AI clips",
    "social media tool",
  ],
  openGraph: {
    title: "MultiUploads — Upload Once, Distribute Everywhere",
    description:
      "One video. Every platform. AI-powered clips. Maximum reach.",
    type: "website",
  },
};

const hydrationAttributeGuard = `
  (function () {
    var exactMatches = {
      bis_register: true,
      bis_skin_checked: true,
    };

    function shouldRemoveAttribute(name) {
      return !!exactMatches[name] || name.indexOf("__processed_") === 0;
    }

    function cleanElement(element) {
      if (!element || !element.getAttributeNames) return;

      var names = element.getAttributeNames();
      for (var i = 0; i < names.length; i += 1) {
        if (shouldRemoveAttribute(names[i])) {
          element.removeAttribute(names[i]);
        }
      }
    }

    function cleanTree(root) {
      if (!root || root.nodeType !== 1) return;

      cleanElement(root);

      var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      var node = walker.nextNode();

      while (node) {
        cleanElement(node);
        node = walker.nextNode();
      }
    }

    function start() {
      cleanTree(document.documentElement);

      var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          var mutation = mutations[i];

          if (
            mutation.type === "attributes" &&
            shouldRemoveAttribute(mutation.attributeName)
          ) {
            mutation.target.removeAttribute(mutation.attributeName);
          }

          for (var j = 0; j < mutation.addedNodes.length; j += 1) {
            cleanTree(mutation.addedNodes[j]);
          }
        }
      });

      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    }

    start();
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        suppressHydrationWarning
      >
        <Script
          id="hydration-attribute-guard"
          strategy="beforeInteractive"
        >
          {hydrationAttributeGuard}
        </Script>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
