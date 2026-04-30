# 🎨 Design System — Primary School Management System

> **Stack:** Vue 3 + Tailwind CSS  
> **Style:** Friendly & Soft · Neutral/Minimal · Khmer First  
> **Font:** Hanuman (Khmer) + Inter (Latin fallback)

---

## 🔤 Typography

### Font Setup
```css
/* index.css or tailwind base */
@import url('https://fonts.googleapis.com/css2?family=Hanuman:wght@400;700&family=Inter:wght@400;500;600&display=swap');

body {
  font-family: 'Hanuman', 'Inter', sans-serif;
}
```

### Font Scale
| Role | Size | Weight | Usage |
|---|---|---|---|
| Page Title | 20px | 700 | Main page headings |
| Section Title | 16px | 700 | Card titles, section headers |
| Body | 14px | 400 | Regular content, labels |
| Small | 12px | 400 | Meta info, table rows |
| Tiny | 11px | 400 | Badges, timestamps, captions |

### Tailwind Config
```js
// tailwind.config.js
fontFamily: {
  sans: ['Hanuman', 'Inter', 'sans-serif'],
}
```

---

## 🎨 Color Palette

### Primary — Slate Blue (Brand)
Used for active nav, primary buttons, links, accents.

| Token | Hex | Usage |
|---|---|---|
| `primary-50` | `#F0F4F8` | Active nav background |
| `primary-100` | `#D9E8F5` | Button hover bg |
| `primary-500` | `#4A7FA5` | Primary button, links |
| `primary-700` | `#2C5282` | Active nav text, icon fill |
| `primary-900` | `#1A3557` | Dark text on light bg |

### Neutral — Gray (Base)
Used for all backgrounds, borders, text.

| Token | Hex | Usage |
|---|---|---|
| `gray-50` | `#F9FAFB` | Page background |
| `gray-100` | `#F3F4F6` | Secondary background, hover |
| `gray-200` | `#E5E7EB` | Borders, dividers |
| `gray-400` | `#9CA3AF` | Placeholder, disabled |
| `gray-600` | `#4B5563` | Secondary text |
| `gray-800` | `#1F2937` | Primary text |
| `gray-900` | `#111827` | Headings |

### Semantic Colors
| Purpose | Color | Bg Token | Text Token | Border Token |
|---|---|---|---|---|
| Success / Present | Green | `#F0FFF4` | `#276749` | `#9AE6B4` |
| Danger / Absent | Red | `#FFF5F5` | `#9B2C2C` | `#FEB2B2` |
| Warning / Late | Amber | `#FFFBEB` | `#92400E` | `#FCD34D` |
| Info / Permission | Blue | `#EBF4FF` | `#2B6CB0` | `#BEE3F8` |
| Neutral / Inactive | Gray | `#F3F4F6` | `#4B5563` | `#E5E7EB` |

### Tailwind Config
```js
// tailwind.config.js
colors: {
  primary: {
    50:  '#F0F4F8',
    100: '#D9E8F5',
    500: '#4A7FA5',
    700: '#2C5282',
    900: '#1A3557',
  }
}
```

---

## 📐 Spacing & Layout

### Base Spacing Scale
Always use multiples of 4px.
```
4px   → gap between inline elements
8px   → padding inside small components (badges, tags)
12px  → inner card padding (compact)
16px  → standard card padding
20px  → page content padding
24px  → section gaps
32px  → between major sections
```

### Page Layout
```
Sidebar width:    220px (fixed)
Content area:     flex-1 (fills remaining space)
Top bar height:   56px
Content padding:  20px all sides
Card gap:         12px
```

### Breakpoints (Tailwind default)
| Name | Width | Usage |
|---|---|---|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop (main target) |
| `xl` | 1280px | Desktop |

---

## 🧩 Component Library

---

### 1. Sidebar Navigation

```
Width: 220px
Background: white
Border-right: 1px solid gray-200
Position: fixed left
```

**Structure:**
```
[Logo + School Name]
─────────────────────
[Nav Section Label]   ← tiny uppercase gray text
[Nav Item]            ← icon + Khmer label
[Nav Item - Active]   ← blue bg, blue text
─────────────────────
[User Profile]        ← avatar + name + role (bottom)
```

**Nav Item States:**
```css
/* Default */
.nav-item {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #4B5563;       /* gray-600 */
}

/* Hover */
.nav-item:hover {
  background: #F3F4F6;  /* gray-100 */
}

/* Active */
.nav-item.active {
  background: #F0F4F8;  /* primary-50 */
  color: #2C5282;       /* primary-700 */
  font-weight: 700;
}
```

**Nav Icon:**
- Size: 18x18px
- Default: gray bg with gray icon
- Active: primary-700 bg with white icon
- Border-radius: 6px

---

### 2. Top Bar

```
Height: 56px
Background: white
Border-bottom: 1px solid gray-200
Contents: [Page Title] ........... [Academic Year Badge] [Avatar]
```

---

### 3. Cards

Cards are the main UI container. All content lives inside cards.

**Base Card:**
```css
.card {
  background: white;
  border: 1px solid #E5E7EB;   /* gray-200 */
  border-radius: 12px;          /* rounded-xl */
  padding: 16px;
}
```

**Card Header:**
```
[Card Title]         [Action Link or Button]
```

**Tailwind:**
```html
<div class="bg-white border border-gray-200 rounded-xl p-4">
  <div class="flex items-center justify-between mb-3">
    <h3 class="text-sm font-bold text-gray-900">ចំណងជើង</h3>
    <button class="text-xs text-primary-500 hover:underline">មើលទាំងអស់</button>
  </div>
  <!-- content -->
</div>
```

**Stat Card (Dashboard):**
```html
<div class="bg-white border border-gray-200 rounded-xl p-4">
  <div class="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
    <!-- icon -->
  </div>
  <p class="text-2xl font-bold text-gray-900">248</p>
  <p class="text-xs text-gray-500 mt-1">សិស្សសរុប</p>
  <p class="text-xs text-green-600 mt-1">+12 ឆ្នាំនេះ</p>
</div>
```

---

### 4. Buttons

**Primary Button:**
```html
<button class="bg-primary-700 hover:bg-primary-900 text-white text-sm font-bold
               px-4 py-2 rounded-lg transition-colors">
  បន្ថែម
</button>
```

**Secondary Button (Outline):**
```html
<button class="border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm
               font-bold px-4 py-2 rounded-lg transition-colors">
  បោះបង់
</button>
```

**Danger Button:**
```html
<button class="bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold
               px-4 py-2 rounded-lg border border-red-200 transition-colors">
  លុប
</button>
```

**Icon Button:**
```html
<button class="w-8 h-8 flex items-center justify-center rounded-lg
               hover:bg-gray-100 text-gray-500 transition-colors">
  <!-- icon -->
</button>
```

---

### 5. Form Inputs

**Text Input:**
```html
<div class="flex flex-col gap-1">
  <label class="text-xs font-bold text-gray-600">ឈ្មោះសិស្ស</label>
  <input
    type="text"
    placeholder="បញ្ចូលឈ្មោះ..."
    class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900
           placeholder-gray-400 focus:outline-none focus:border-primary-500
           focus:ring-2 focus:ring-primary-100 transition-all"
  />
</div>
```

**Select Dropdown:**
```html
<select class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900
               focus:outline-none focus:border-primary-500 focus:ring-2
               focus:ring-primary-100 bg-white w-full">
  <option>ជ្រើសរើស...</option>
</select>
```

**Date Input:**
```html
<input type="date"
  class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900
         focus:outline-none focus:border-primary-500 focus:ring-2
         focus:ring-primary-100 w-full" />
```

---

### 6. Badges & Status Pills

```html
<!-- Present / Success -->
<span class="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
  មានវត្តមាន
</span>

<!-- Absent / Danger -->
<span class="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
  អវត្តមាន
</span>

<!-- Late / Warning -->
<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
  យឺត
</span>

<!-- Permission / Info -->
<span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
  មានច្បាប់
</span>
```

---

### 7. Table

```html
<div class="overflow-hidden rounded-xl border border-gray-200">
  <table class="w-full text-sm">
    <thead class="bg-gray-50 border-b border-gray-200">
      <tr>
        <th class="text-left text-xs font-bold text-gray-500 px-4 py-3">ឈ្មោះ</th>
        <th class="text-left text-xs font-bold text-gray-500 px-4 py-3">ថ្នាក់</th>
        <th class="text-left text-xs font-bold text-gray-500 px-4 py-3">វត្តមាន</th>
        <th class="text-left text-xs font-bold text-gray-500 px-4 py-3">សកម្មភាព</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 bg-white">
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 text-gray-900">សុខ ចន្ថា</td>
        <td class="px-4 py-3 text-gray-500">ថ្នាក់ទី ១</td>
        <td class="px-4 py-3">
          <span class="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            មានវត្តមាន
          </span>
        </td>
        <td class="px-4 py-3">
          <!-- action buttons -->
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 8. Avatar

```html
<!-- With image -->
<img src="..." class="w-9 h-9 rounded-full object-cover border border-gray-200" />

<!-- Initials fallback -->
<div class="w-9 h-9 rounded-full bg-primary-700 flex items-center justify-center
            text-white text-xs font-bold">
  សច
</div>
```

---

### 9. Modal / Dialog

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
  <!-- Modal Box -->
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base font-bold text-gray-900">បន្ថែមសិស្សថ្មី</h2>
      <button class="text-gray-400 hover:text-gray-600 text-lg">✕</button>
    </div>
    <!-- Content -->
    <div class="space-y-3">
      <!-- form inputs here -->
    </div>
    <!-- Footer -->
    <div class="flex gap-2 mt-5 justify-end">
      <button class="...">បោះបង់</button>
      <button class="...">រក្សាទុក</button>
    </div>
  </div>
</div>
```

---

### 10. Toast Notification

```html
<!-- Success -->
<div class="fixed bottom-4 right-4 z-50 flex items-center gap-3
            bg-white border border-green-200 rounded-xl shadow-md px-4 py-3">
  <div class="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm">
    ✓
  </div>
  <p class="text-sm text-gray-800 font-bold">រក្សាទុករួចរាល់!</p>
</div>

<!-- Error -->
<div class="fixed bottom-4 right-4 z-50 flex items-center gap-3
            bg-white border border-red-200 rounded-xl shadow-md px-4 py-3">
  <div class="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm">
    ✕
  </div>
  <p class="text-sm text-gray-800 font-bold">មានបញ្ហា! សូមព្យាយាមម្ដងទៀត</p>
</div>
```

---

### 11. Empty State

```html
<div class="flex flex-col items-center justify-center py-16 text-center">
  <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center
              text-2xl mb-4">
    📭
  </div>
  <p class="text-sm font-bold text-gray-700">មិនមានទិន្នន័យ</p>
  <p class="text-xs text-gray-400 mt-1">សូមបន្ថែមទិន្នន័យថ្មី</p>
  <button class="mt-4 ...">បន្ថែម</button>
</div>
```

---

### 12. Loading Skeleton

```html
<div class="animate-pulse space-y-3">
  <div class="h-4 bg-gray-200 rounded-lg w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded-lg w-1/2"></div>
  <div class="h-4 bg-gray-200 rounded-lg w-2/3"></div>
</div>
```

---

## 🗂️ Page Layout Templates

### Dashboard Grid
```
┌─────────────────────────────────────────────────────┐
│  [Stat]  [Stat]  [Stat]  [Stat]    ← 4 cols grid   │
├─────────────────────────┬───────────────────────────┤
│  [Recent Students]      │  [Attendance Summary]     │
│  (table card)           │  (bar chart card)         │
├──────────────┬──────────┴──────────┬────────────────┤
│  [Mini Card] │  [Mini Card]        │  [Mini Card]   │
└──────────────┴─────────────────────┴────────────────┘
```

### List Page (Students, Teachers, Books)
```
┌─────────────────────────────────────────────────────┐
│  [Page Title]                  [+ បន្ថែម Button]    │
├──────────────────┬──────────────────────────────────┤
│  [Search Input]  │  [Filter Select]  [Filter Select] │
├─────────────────────────────────────────────────────┤
│  [Table with pagination]                             │
└─────────────────────────────────────────────────────┘
```

### Detail Page (Student Profile)
```
┌──────────────────┬──────────────────────────────────┐
│  [Avatar]        │  Student Name (large)            │
│  [Profile Info]  │  Class · Gender · DOB            │
│                  │  [Edit Button]                   │
├──────────────────┴──────────────────────────────────┤
│  [Tab: ព័ត៌មាន] [Tab: វត្តមាន] [Tab: ពិន្ទុ] ...  │
├─────────────────────────────────────────────────────┤
│  [Tab Content Card]                                  │
└─────────────────────────────────────────────────────┘
```

### Score Entry Page
```
┌─────────────────────────────────────────────────────┐
│  [Select: ថ្នាក់]  [Select: ខែ]  [Select: ប្រភេទ]  │
├─────────────────────────────────────────────────────┤
│  [Score Entry Table]                                 │
│  Name | Subject1 | Subject2 | ... | Average         │
│  ──── │ [input]  │ [input]  │ ... │ (auto)          │
├─────────────────────────────────────────────────────┤
│                              [រក្សាទុក Button]       │
└─────────────────────────────────────────────────────┘
```

---

## 👁️ Role-Based UI Differences

| Element | Admin | Teacher | Librarian |
|---|---|---|---|
| Sidebar color accent | Primary Blue | Primary Blue | Primary Blue |
| Nav items shown | All | Class-scoped | Library only |
| Role badge color | `bg-purple-50 text-purple-700` | `bg-blue-50 text-blue-700` | `bg-amber-50 text-amber-700` |
| Dashboard stats | School-wide | Class-only | Books/borrows |

---

## 📱 Parent Portal Design

The parent portal is **separate from the main app** — simpler, mobile-first.

```
Background: gray-50
Max-width: 480px (centered, mobile feel)
No sidebar
No top bar
Logo + school name at top center
```

**Search Card:**
```html
<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm">
    <div class="text-center mb-6">
      <!-- school logo -->
      <h1 class="text-lg font-bold text-gray-900 mt-3">មើលព័ត៌មានកូន</h1>
      <p class="text-xs text-gray-500 mt-1">បញ្ចូលឈ្មោះ និងថ្ងៃខែឆ្នាំកំណើត</p>
    </div>
    <!-- search form -->
  </div>
</div>
```

**Student result tabs:**
```
[វត្តមាន] [ពិន្ទុ] [សុខភាព] [កំណើន] [ចាក់វ៉ាក់សាំង] [ថ្ងៃឈឺ]
```

---

## ✅ Design Dos & Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Use rounded-xl (12px) for cards | Use sharp square corners |
| Use gray-200 for borders | Use heavy dark borders |
| Keep spacing consistent (multiples of 4) | Mix random padding values |
| Use Hanuman font for all Khmer text | Use system fonts for Khmer |
| Use semantic colors for status badges | Use random colors for status |
| Show loading skeletons while fetching | Show blank white screens |
| Use empty state illustrations | Leave pages blank with no message |
| Keep buttons consistent size | Mix large and small buttons randomly |
| Use soft blue as the only accent color | Add multiple accent colors |

---

## 🔧 Tailwind Config Summary

```js
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanuman', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#F0F4F8',
          100: '#D9E8F5',
          500: '#4A7FA5',
          700: '#2C5282',
          900: '#1A3557',
        }
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
      }
    }
  },
  plugins: [],
}
```

---

## 📦 Recommended UI Libraries

| Library | Purpose | Install |
|---|---|---|
| `@headlessui/vue` | Modal, dropdown, tabs (accessible) | `npm i @headlessui/vue` |
| `@heroicons/vue` | Clean SVG icons | `npm i @heroicons/vue` |
| `vue-chartjs` | Charts for growth & scores | `npm i vue-chartjs chart.js` |
| `vee-validate` + `yup` | Form validation | `npm i vee-validate yup` |
| `@vueuse/core` | Vue utilities (debounce, etc.) | `npm i @vueuse/core` |

---

*This design system should be followed across all pages and components for consistency.*
