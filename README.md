# 🌟 Soulink – AI Soul Connection Platform

Welcome to **Soulink**, an AI-assisted compatibility and self-reflection platform for deeper connections in love, friendship and personal growth.

Soulink helps users build a “soul profile” based on love languages, values, hobbies, birthday-based insights, boundaries, personal story and connection preferences.

---

## 🧱 Project Type

Soulink is a static frontend project built with:

- ✅ HTML5
- ✅ CSS3
- ✅ Vanilla JavaScript
- ✅ Firebase Authentication
- ✅ Cloud Firestore
- ✅ Firebase Storage
- ✅ Vercel static hosting
- ✅ No React
- ✅ No Vite
- ✅ No build tools required

The project is deployed as a static site on Vercel.

---

## 🎨 Brand Style

Main Soulink design direction:

- Background: dark teal `#003c43`
- Neon glow: `#00FDD8`
- Font: Segoe UI / system UI
- Visual style: glass cards, soft glow, dark teal gradients
- Layout: mobile-first, responsive, calm and mystical
- Navigation: unified navbar handled by `nav.js`

Do not redesign the platform unless specifically requested.

---

## 🔐 Current Data Architecture

Soulink now uses Firebase for logged-in users.

### Source of truth

For logged-in users:

```txt
Firestore: users/{uid}
```
