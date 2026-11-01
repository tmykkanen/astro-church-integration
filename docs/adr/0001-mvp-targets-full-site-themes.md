---
status: superseded by ADR-0002
---

# MVP targets full-site themes, anchored on astro-church

The MVP is designed around one Theme per Site, where the Theme is a complete website (it owns `/`). The concrete acceptance target is the existing `astro-church` template becoming an installable, updatable package. Section themes (mounted under a path beside the Site's own pages), component kits, and multiple Themes per Site are deliberately excluded. The original Astro Theme Provider allowed multiple and section-style themes but never designed for the resulting route, CSS, and integration conflicts; anchoring on one real theme keeps requirements grounded. The design should not preclude section themes later.
