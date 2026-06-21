# Implementation Plan for Leaderboard Ad Slot Improvements

The homepage **leaderboard** ad slot is already functional, but we identified four
areas where it can be improved:

1. **Add a video example to the `BillboardShowcase` fallback**
2. **Track impressions for every carousel slide**
3. **Make the leaderboard height responsive on mobile**
4. **Make the fallback content configurable via the CMS**

Below is a concrete plan for each point, including the files that need to be
modified, the required code changes, and any supporting tasks (e.g., CMS schema
updates).

---

## 1️⃣ Add a video example to the `BillboardShowcase` fallback

*Goal*: When there are no real ads, the placeholder should showcase a video
instead of only static graphic billboards, demonstrating that the slot can also
render video banners.

**Steps**

1. Extend `CATEGORY_ADS` in `apps/web/components/ui/BillboardShowcase.tsx` with a
   new entry that includes a video URL.
2. Add a `mediaType: 'video' | 'image'` field to the `CategoryAd` interface so the
   component knows whether to render a `<video>` element.
3. In the render loop, conditionally render `<video>` when `mediaType === 'video'`
   (similar to the logic in `AdSlide`).
4. Provide a short description in the comment block to make the purpose clear.

**Code sketch** (insert into `BillboardShowcase.tsx`):

```tsx
interface CategoryAd {
  id: string;
  headline: string;
  subheadline: string;
  category: string;
  accentFrom: string;
  accentTo: string;
  ctaText: string;
  icon: React.ReactNode;
  mediaType?: 'image' | 'video'; // new optional prop
  mediaUrl?: string; // URL to image or video
}

// Example video ad (you can host a short looped video in the public folder)
{
  id: 'video_demo',
  headline: 'Video Demo Billboard',
  subheadline: 'Contoh iklan video pada slot leaderboard',
  category: 'Demo Video',
  accentFrom: 'from-pink-600',
  accentTo: 'to-rose-800',
  ctaText: 'Lihat Demo',
  icon: <YourSvgIcon />, // reuse an existing icon
  mediaType: 'video',
  mediaUrl: '/videos/leaderboard-demo.mp4',
}
```

In the JSX, after the gradient/background, render:

```tsx
{ad.mediaType === 'video' && ad.mediaUrl ? (
  <video src={ad.mediaUrl} autoPlay loop muted className="w-full h-full object-cover" />
) : (
  // existing image/background stays unchanged
)}
```

---

## 2️⃣ Track impressions for every carousel slide

*Goal*: Currently only the first displayed ad is tracked. We want an impression to
be recorded each time a new slide becomes visible.

**Steps**

1. Move the `IntersectionObserver` logic from a single‑ad effect to a separate
   effect that watches the **currently visible slide** (`currentIndex`).
2. When `currentIndex` changes, call the tracking endpoint for that ad if it has
   not been tracked yet.
3. Store tracked IDs in a `Set` (already present) so we do not double‑count.

**Patch outline** (in `AdSpace.tsx`):

```tsx
// New effect – runs whenever currentIndex changes
useEffect(() => {
  const ad = ads[currentIndex];
  if (!ad || trackedRef.current.has(ad.id)) return;
  // Same IntersectionObserver logic as before, but observe the container of the new slide
  const observer = new IntersectionObserver((entries) => {
    const [entry] = entries;
    if (entry?.isIntersecting) {
      trackedRef.current.add(ad.id);
      fetch(`${API_URL}/api/v1/ads/track/${ad.id}?action=impression`, { method: 'POST' }).catch(() => {});
      observer.disconnect();
    }
  }, { threshold: 0.5 });
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, [ads, currentIndex]);
```

---

## 3️⃣ Make the leaderboard height responsive on mobile

*Goal*: Reduce the vertical space the leaderboard consumes on small screens.

**Steps**

1. Update the `styles` object in `AdSpace.tsx` to use Tailwind responsive values.
   Replace the static `h-24 md:h-[250px]` with something like:
   ```tsx
   leaderboard: "w-full h-[120px] md:h-[250px] mb-6",
   ```
   (`h-[120px]` ≈ 30 rem on mobile).
2. Ensure the fallback `BillboardShowcase` container also respects the same
   class (it already uses `h-24 md:h-[250px]`). Adjust its class list to the new
   values.
3. Run a quick visual test (`npm run dev`) and verify that the ad slot shrinks
   on mobile while staying full‑width on desktop.

---

## 4️⃣ Make the fallback content configurable via the CMS

*Goal*: Content editors should be able to change the placeholder billboard
examples without touching code.

**Steps**

1. **Backend** – Add a new API endpoint (e.g., `GET /api/v1/ads/fallback`) that
   returns a JSON array of fallback ads. This can reuse the same shape as the
   regular ad objects (`id`, `headline`, `subheadline`, `category`, `accentFrom`,
   `accentTo`, `ctaText`, `icon`, `mediaType`, `mediaUrl`).
2. **CMS** – Add a simple UI page under the admin panel where editors can
   create / edit fallback items (title, description, optional video URL). Store
   the data in the existing `ads` collection with a flag `isFallback: true`.
3. **Front‑end** – In `AdSpace.tsx`, when `ads` is empty and the slot is
   `leaderboard`, fetch the fallback endpoint instead of rendering the static
   `BillboardShowcase`. Map the received items to the same UI used by
   `BillboardShowcase` (or reuse the component with a prop `fallbackAds`).
4. **Graceful fallback** – Keep the current hard‑coded `BillboardShowcase`
   as a secondary fallback in case the CMS request fails.

**High‑level code change** (pseudo‑code):

```tsx
if (ads.length === 0) {
  // Try to load CMS‑configured fallback ads
  const { data: fallbackAds } = useSWR(`/api/v1/ads/fallback?slot=leaderboard`);
  if (fallbackAds?.length) return <BillboardShowcase ads={fallbackAds} ... />;
  // Old static fallback
  return <BillboardShowcase site={site || 'pusat'} className={className} />;
}
```

---

## Timeline & Ownership

| Item | Owner | Estimate |
|------|-------|----------|
| Video example in `BillboardShowcase` | Front‑end dev | 0.5 day |
| Carousel impression tracking | Front‑end dev | 0.5 day |
| Mobile‑responsive height | Front‑end dev | 0.25 day |
| CMS fallback endpoint & UI | Back‑end & admin‑panel dev | 2 days |

The total effort is roughly **3 working days**. All changes are backward
compatible; existing ads continue to work, and the new logic only activates
when the corresponding conditions are met.

---

**Next steps**: Merge this plan, create a feature branch (`feature/leaderboard-
improvements`), and start implementing the items in the order listed.

---

*Generated by Cline – a virtual software engineer.*
