# Teamly — Project Design Direction

## Visual Identity

Teamly should use a **minimalist, editorial, developer-oriented visual language** inspired by modern product and developer websites such as Motion.

The interface should feel **precise, functional, calm, and intentionally designed**, rather than visually overloaded. The design should prioritize strong typography, clear hierarchy, spacing, borders, and layout over decorative effects.

The overall visual direction is:

> **Sharp. Minimal. Editorial. Technical. Human.**

Avoid the generic visual language commonly associated with AI-generated SaaS interfaces.

---

## Core Design Principles

### 1. Sharp Geometry

Prefer **square or nearly-square corners** throughout the interface.

Default:

```text
border-radius: 0
```

Small radii may be used only when there is a clear usability reason, such as native controls or specific interactive elements.

Avoid making every component a rounded rectangle.

Do **not** use:

* Excessive pill-shaped buttons
* Heavily rounded cards
* Large `border-radius` values
* "Floating blob" UI
* Excessive circular containers

Buttons, cards, inputs, navigation elements, and panels should generally use **sharp corners and visible geometry**.

---

### 2. Borders Over Shadows

Use **thin borders** to establish hierarchy and separation.

Preferred:

```text
1px solid border
```

Use shadows sparingly.

The interface should rely primarily on:

* Borders
* Spacing
* Typography
* Contrast
* Background separation

rather than large drop shadows.

Avoid:

```text
box-shadow: 0 20px 50px rgba(...)
```

or other exaggerated "floating SaaS card" effects.

Cards should feel like **structured sections of an interface**, not glass panels floating above the page.

---

### 3. No Generic AI Gradients

**Do not use decorative gradients as a default visual treatment.**

Avoid:

* Purple-to-blue gradients
* Pink-to-purple gradients
* Cyan glow gradients
* Rainbow AI gradients
* Gradient text
* Gradient borders
* Glowing backgrounds
* Large radial gradient blobs

Teamly should not visually communicate:

> "This is an AI app because everything is purple and glowing."

AI functionality should be communicated through **good information design and interaction**, not visual clichés.

Gradients may only be introduced when there is a specific functional or branding reason.

---

## Color Palette

Teamly should use a restrained monochrome palette with one controlled accent color.

### Light Theme

```css
--background: #F7F7F5;
--surface: #FFFFFF;
--surface-subtle: #F0F0ED;

--foreground: #171717;
--foreground-muted: #666666;
--foreground-subtle: #909090;

--border: #D9D9D5;
--border-strong: #B8B8B3;

--accent: #2563EB;
--accent-foreground: #FFFFFF;

--success: #287A4B;
--warning: #A16207;
--danger: #B42318;
```

### Dark Theme

```css
--background: #111111;
--surface: #181818;
--surface-subtle: #222222;

--foreground: #F2F2F0;
--foreground-muted: #A3A3A0;
--foreground-subtle: #777774;

--border: #303030;
--border-strong: #454545;

--accent: #6EA8FF;
--accent-foreground: #0B1220;

--success: #58A978;
--warning: #D19A38;
--danger: #E06B61;
```

### Color Usage Rules

The majority of the interface should remain within the neutral palette.

The accent color should primarily be used for:

* Primary actions
* Active navigation states
* Links
* Important interactive controls
* Focus states
* Selected states

Status colors should communicate **meaning**, not decoration.

For example:

```text
Red    → Overdue / Critical
Yellow → Due Soon / Attention
Green  → Completed
Blue   → Informational / Active
```

Do not use many saturated colors simultaneously.

---

## Typography

Typography should provide most of the visual character.

Use a clean modern sans-serif font with strong readability.

Recommended hierarchy:

```text
Page title
Section heading
Card heading
Body text
Secondary metadata
```

Use:

* Strong but not excessive font weights
* Tight headings
* Comfortable body line-height
* Clear size differences between hierarchy levels

Avoid excessively oversized marketing typography inside application screens.

The interface should feel like a **product application**, not a landing-page advertisement.

---

## Buttons

Buttons should be **compact, rectangular, and purposeful**.

Example:

```text
┌──────────────────┐
│    Add Assignment│
└──────────────────┘
```

Prefer:

* Square corners
* Thin borders
* Clear hover states
* Clear focus states
* Strong typography
* Small, controlled padding

Primary buttons may use the accent color.

Secondary buttons should generally use:

```text
transparent background
+
border
+
foreground
```

Avoid:

```text
💜 Huge rounded gradient button
```

---

## Form Inputs

Inputs should use a clean rectangular treatment:

```text
┌──────────────────────────────┐
│ Enter your email             │
└──────────────────────────────┘
```

Preferred characteristics:

* Thin border
* Square corners
* Clear focus outline
* Minimal decoration
* Strong readability

Avoid excessive inner shadows, floating labels everywhere, or decorative gradients.

---

## Cards & Panels

Cards should function as **organizational containers**, not decorative objects.

Preferred:

```text
┌────────────────────────────────────┐
│ Assignment                         │
│ Programming Activity 3             │
│                                    │
│ Due Friday · DAA                   │
└────────────────────────────────────┘
```

Use:

* Borders
* Consistent spacing
* Clear section headers
* Subtle background contrast

Avoid excessive:

* Rounded corners
* Shadows
* Glassmorphism
* Blur
* Decorative gradients

---

## Dashboard Design

Teamly's dashboard should prioritize **information density with clarity**.

The dashboard should immediately communicate:

1. What is new
2. What is due soon
3. What is overdue
4. What has been completed
5. What requires attention

Prefer structured sections such as:

```text
┌──────────────────────────────────────────┐
│ TEAMLY                                   │
│ Academic Assignment Assistant            │
├──────────────────────────────────────────┤
│                                          │
│  3 New      5 Active      2 Due Soon     │
│                                          │
├──────────────────────────────────────────┤
│ Due Soon                                  │
│                                          │
│ DAA — Programming Activity 3             │
│ Due tomorrow · 11:59 PM                  │
│                                          │
├──────────────────────────────────────────┤
│ Recent Assignments                       │
│                                          │
│ HCI — Prototype                          │
│ IM2 — Database Activity                  │
└──────────────────────────────────────────┘
```

The dashboard should feel like an **information command center**, not a collection of decorative cards.

---

## AI Interface Direction

AI-generated information should be visually integrated into the existing information hierarchy rather than presented as a flashy chatbot.

For example:

```text
AI SUMMARY
────────────────────────────────
Implement a linked-list based
student management system...

REQUIREMENTS
────────────────────────────────
□ Source code
□ Documentation
□ Linked-list implementation
□ Testing
```

AI should feel like a **useful layer over assignment information**.

Avoid:

* Giant AI sparkles
* Floating chatbot bubbles everywhere
* Gradient AI cards
* "MAGIC AI" buttons
* Excessive AI branding

A small label such as:

```text
AI SUMMARY
```

is sufficient.

---

## Motion & Interaction

Motion should be **functional, restrained, and tactile**.

Animations should communicate:

* State changes
* Navigation
* Expansion/collapse
* Loading
* Success/failure
* Selection
* Reordering

Prefer short, subtle transitions.

Examples:

```text
Button press
→ slight scale/position response

Panel open
→ controlled height/opacity transition

Assignment status change
→ smooth state transition

Page navigation
→ subtle movement/fade
```

Avoid:

* Excessive bouncing
* Constant floating animations
* Decorative background animation
* Large parallax effects
* Continuous looping effects

Motion should make Teamly feel **responsive**, not distracting.

---

## Responsive Design

The current Django implementation is a **web-based foundation**, but Teamly's final production direction is a mobile application.

Therefore, the current interface should be designed with a **mobile-first mindset** while remaining fully functional in a desktop browser.

Prioritize:

* Compact layouts
* Touch-friendly controls
* Responsive typography
* Responsive navigation
* Avoiding unnecessarily wide content
* Clear mobile information hierarchy

The Django implementation should visually establish Teamly's design language without attempting to reproduce every detail of the future React Native interface.

---

## Visual Anti-Patterns

The following should be avoided unless explicitly required by a feature:

```text
❌ Excessive rounded corners
❌ Pill-shaped everything
❌ Purple/blue AI gradients
❌ Gradient text
❌ Glassmorphism everywhere
❌ Excessive drop shadows
❌ Floating blobs
❌ Neon glow effects
❌ Decorative AI sparkles
❌ Excessive animations
❌ Overloaded dashboards
❌ Huge marketing-style headings
❌ Generic "AI SaaS" visual templates
```

Teamly should look like a **purpose-built academic productivity tool**, not a generic AI startup landing page.

---

## Design Reference

The intended visual direction may be described as:

> **Sharp-edged minimalist editorial UI with strong typography, thin borders, restrained color, structured information density, and purposeful motion.**

The goal is not to copy another website's exact appearance. The goal is to adopt the underlying design principles:

```text
Strong typography
        +
Sharp geometry
        +
Thin borders
        +
Restrained palette
        +
High information clarity
        +
Purposeful motion
        =
Teamly
```
