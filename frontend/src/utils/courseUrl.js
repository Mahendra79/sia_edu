// Course URLs are "<id>-<title-slug>", e.g. /course/42-advanced-quantum-computing.
// The numeric id (always the leading segment) is what's actually used to look the
// course up - the slug is only there to make the URL readable/SEO-friendly.

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCourseUrl(course) {
  if (!course?.id) return "/";
  const slug = slugify(course.title);
  return slug ? `/course/${course.id}-${slug}` : `/course/${course.id}`;
}

export function parseCourseIdFromParam(param) {
  const match = String(param || "").match(/^\d+/);
  return match ? match[0] : "";
}
