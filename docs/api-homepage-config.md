# API Documentation — Homepage Config

> Endpoint untuk mengelola konfigurasi homepage per site.

## Endpoints

### GET `/api/v1/sites/:id/homepage-config`

Ambil konfigurasi homepage untuk sebuah site.

**Auth:** Public (tidak perlu login)

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Ya | Site ID (UUID) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "siteId": "uuid",
    "template": "F",
    "heroMode": "MAGAZINE_COVER_550",
    "feedLayout": "sidebar_70_30",
    "trendingStyle": "numbered_podium",
    "scoreFreshness": 0.4,
    "scoreEngagement": 0.3,
    "scoreEditorial": 0.3,
    "opinionCategories": ["opini", "kolom-esai", "analisis", "kolom"],
    "photoCategories": ["foto-jurnalistik"],
    "videoCategories": ["video", "dokumenter-reportase"],
    "sectionOrder": ["hero", "fokus_redaksi", "trending", "feed", "pilihan_editor", "opini", "foto", "video"],
    "sectionVisibility": {
      "hero": true,
      "fokus_redaksi": true,
      "trending": true,
      "feed": true,
      "pilihan_editor": true,
      "opini": true,
      "foto": true,
      "video": true
    }
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": {
    "code": "HOMEPAGE_CONFIG_FETCH_FAILED",
    "message": "Homepage config not found"
  }
}
```

---

### PUT `/api/v1/sites/:id/homepage-config`

Update konfigurasi homepage. Hanya untuk superadmin/wapimred.

**Auth:** Bearer Token (JWT)

**Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Ya | Site ID (UUID) |

**Request Body:**
```json
{
  "template": "F",
  "heroMode": "MAGAZINE_COVER_550",
  "feedLayout": "sidebar_70_30",
  "trendingStyle": "numbered_podium",
  "scoreFreshness": 0.4,
  "scoreEngagement": 0.3,
  "scoreEditorial": 0.3,
  "opinionCategories": ["opini", "kolom-esai", "analisis", "kolom"],
  "photoCategories": ["foto-jurnalistik"],
  "videoCategories": ["video", "dokumenter-reportase"],
  "sectionOrder": ["hero", "fokus_redaksi", "trending", "feed", "pilihan_editor", "opini", "foto", "video"],
  "sectionVisibility": {
    "hero": true,
    "fokus_redaksi": true,
    "trending": true,
    "feed": true,
    "pilihan_editor": true,
    "opini": true,
    "foto": true,
    "video": true
  }
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* updated config */ }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response 403:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

---

## Field Reference

### Template Selection

| Field | Type | Default | Values |
|-------|------|---------|--------|
| `template` | string | `"F"` | `A`, `B`, `C`, `D`, `E`, `F` |
| `heroMode` | string | `"MAGAZINE_COVER_550"` | `MAGAZINE_COVER_550`, `BENTO_4`, `MAGAZINE_COVER`, `SPLIT_HERO`, `BENTO_3`, `DUAL_HERO` |
| `feedLayout` | string | `"sidebar_70_30"` | `sidebar_70_30`, `pattern_rotation`, `asymmetric_heavy`, `text_heavy`, `dense_3col`, `hero_pair_heavy` |
| `trendingStyle` | string | `"numbered_podium"` | `numbered_podium`, `horizontal_strip`, `ticker`, `sticky_sidebar`, `with_context` |

### Scoring Weights

Bobot untuk mengurutkan artikel di Zona 2 (Fokus Redaksi).

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `scoreFreshness` | float | `0.4` | 0–1 | Bobot freshness (artikel lebih baru = lebih tinggi) |
| `scoreEngagement` | float | `0.3` | 0–1 | Bobot engagement (viewCount) |
| `scoreEditorial` | float | `0.3` | 0–1 | Bobot editorial (isFeatured, isExclusive, isBreaking) |

**Formula:**
```
score = (freshness × scoreFreshness) + (engagement × scoreEngagement) + (editorial × scoreEditorial)
```

### Category Config

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `opinionCategories` | string[] | `["opini", "kolom-esai", "analisis", "kolom"]` | Slug kategori untuk Opini & Analisis |
| `photoCategories` | string[] | `["foto-jurnalistik"]` | Slug kategori untuk Foto Jurnalistik |
| `videoCategories` | string[] | `["video", "dokumenter-reportase"]` | Slug kategori untuk Video Eksklusif |

### Section Control

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sectionOrder` | string[] | `["hero", "fokus_redaksi", "trending", "feed", "pilihan_editor", "opini", "foto", "video"]` | Urutan section di homepage |
| `sectionVisibility` | object | semua `true` | Toggle section on/off |

**Section IDs:**
- `hero` — Zona 1
- `fokus_redaksi` — Zona 2
- `trending` — Zona 3
- `feed` — Zona 4
- `pilihan_editor` — Zona 5 (Pilihan Editor)
- `opini` — Zona 5 (Opini & Analisis)
- `foto` — Zona 5 (Foto Jurnalistik)
- `video` — Zona 5 (Video Eksklusif)

---

## Template Mapping

| Key | Name | Hero | Feed | Trending |
|-----|------|------|------|----------|
| `A` | Classic Editorial | `BENTO_4` | `pattern_rotation` | `horizontal_strip` |
| `B` | Magazine Bold | `MAGAZINE_COVER` | `asymmetric_heavy` | `numbered_podium` |
| `C` | Data-Driven | `SPLIT_HERO` | `text_heavy` | `ticker` |
| `D` | Compact Dense | `BENTO_3` | `dense_3col` | `sticky_sidebar` |
| `E` | Visual Storytelling | `DUAL_HERO` | `hero_pair_heavy` | `with_context` |
| `F` | Best of (Default) ⭐ | `MAGAZINE_COVER_550` | `sidebar_70_30` | `numbered_podium` |

---

## Contoh Penggunaan

### Fetch config (public)
```bash
curl http://localhost:3001/api/v1/sites/SITE_ID/homepage-config
```

### Update config (authenticated)
```bash
curl -X PUT http://localhost:3001/api/v1/sites/SITE_ID/homepage-config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "F",
    "heroMode": "MAGAZINE_COVER_550",
    "feedLayout": "sidebar_70_30",
    "trendingStyle": "numbered_podium",
    "scoreFreshness": 0.5,
    "scoreEngagement": 0.3,
    "scoreEditorial": 0.2
  }'
```
