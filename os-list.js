// Add your entry to os-list.js
const osList = [
  {
    name: "AvdanOS",
    url: "https://dynamicos.netlify.app",
    icon: "https://github.com/DynamicCode1/AvdanOSdemo/blob/main/logo.png?raw=true",
    author: "DynamicCode1",
    repo: "AvdanOSdemo",
    foundation: "DynamicCode1",
    description: "A modern web-based desktop experience built with web technologies. Lightweight and fast.",
    version: "0.3.0",
    featured: false,
    tags: ["webos", "demo", "lightweight", "netlify", "fork"],
    links: [
      { label: "Main", url: "https://dynamicos.netlify.app" }
    ]
  },
  {
    name: "Hyggshi OS Web Edition",
    url: "https://hyggshiosdeveloper.github.io/hyggshi-os-website/OSmain.html",
    icon: "https://raw.githubusercontent.com/HyggshiOSDeveloper/hyggshi-os-website/refs/heads/main/Resources/favicon.ico",
    author: "HyggshiOSDeveloper",
    repo: "hyggshi-os-website",
    foundation: "Hyggshi-OS-Foundation",
    description: "A full-featured web OS with a modern interface, supporting multiple apps and cloud deployment.",
    version: "1.3.0 Beta 26",
    featured: false,
    tags: ["webos", "full", "modern", "cloudflare", "independence"],
    links: [
      { label: "View Web OS in Pages", url: "https://hyggshiosdeveloper.github.io/hyggshi-os-website/OSmain.html" },
      { label: "View Web OS in cloudflare", url: "https://hyggshi-os-website.pages.dev/OSmain" }
    ]
  }
];

/*
  Template for adding a new OS:

  {
    name: "Your OS Name",
    url: "https://your-os-demo.com",
    icon: "https://example.com/logo.png",
    author: "your-github-username",
    repo: "your-repo-name",
    foundation: "Foundation Name",
    description: "A short description of your web OS.",
    version: "1.0",
    featured: false,
    tags: ["tag1", "tag2", "tag3"],
    links: [
      { label: "Main", url: "https://..." },
      { label: "Dev", url: "https://..." }
    ]
  }
*/