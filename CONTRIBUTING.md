# Contributing to Web-OS-community

Thank you for your interest in adding your Web OS to our collection! 🎉

## How to Add Your OS

1. **Fork** this repository
2. **Edit** `os-list.js`
3. Add your entry following the format below
4. **Submit a Pull Request**

## Entry Format

Add a new object to the `osList` array in `os-list.js`:

```js
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
  tags: ["tag1", "tag2"],
  links: [
    { label: "Main", url: "https://..." },
    { label: "Dev", url: "https://..." }
  ]
}
```

## Checklist

Before submitting, make sure your entry meets these requirements:

- [ ] **✓ Favicon** — Your icon/logo URL is valid and accessible
- [ ] **✓ Working URL** — Your demo URL is live and working
- [ ] **✓ Contains no malware.** — Your project is safe and does not contain harmful code
- [ ] **✓ There is a screenshot.** — Your OS has a visual preview (icon/logo counts)
- [ ] **✓ Description** — Provide a short description (1-2 sentences)
- [ ] **✓ Tags** — Add relevant tags (e.g., webos, demo, full, lightweight, cloudflare, netlify)

## Guidelines

- All OS entries must be **web-based** (accessible via browser)
- The `icon` field should point to a **square image** (PNG, JPG, or ICO) preferably 64x64 or larger
- The `url` field should point to the **live demo** of your OS
- Tags help users filter and discover OS projects — use descriptive tags
- Keep `featured` as `false` unless requested otherwise by the maintainers

## Need Help?

Open an issue or start a discussion if you have any questions!