// Regenerates public/sitemap.xml from the live course catalog before every build,
// so the sitemap served from the site root (see public/robots.txt) never goes stale.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCourseUrl } from "../src/utils/courseUrl.js";

const SITE_URL = "https://edu.siasoftwareinnovations.com";
const API_BASE_URL = (process.env.VITE_API_BASE_URL || "https://sia-edu.onrender.com/api").replace(/\/$/, "");

const STATIC_PAGES = [
  { path: "", priority: "1.0" },
  { path: "login", priority: "0.3" },
  { path: "signup", priority: "0.3" },
  { path: "privacy", priority: "0.2" },
  { path: "terms", priority: "0.2" },
];

async function fetchAllActiveCourses() {
  const courses = [];
  let url = `${API_BASE_URL}/courses/?scope=active&page_size=100`;
  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Course fetch failed with status ${response.status}`);
    }
    const data = await response.json();
    const results = Array.isArray(data) ? data : data.results || [];
    courses.push(...results);
    url = Array.isArray(data) ? null : data.next;
  }
  return courses;
}

function buildXml(entries) {
  const today = new Date().toISOString().slice(0, 10);
  const urlTags = entries
    .map(({ loc, lastmod, priority }) => {
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod || today}</lastmod>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>\n`;
}

async function main() {
  const entries = STATIC_PAGES.map(({ path: pagePath, priority }) => ({
    loc: `${SITE_URL}/${pagePath}`,
    priority,
  }));

  try {
    const courses = await fetchAllActiveCourses();
    for (const course of courses) {
      entries.push({
        loc: `${SITE_URL}${getCourseUrl(course)}`,
        lastmod: course.updated_at ? String(course.updated_at).slice(0, 10) : undefined,
        priority: "0.7",
      });
    }
    console.log(`generate-sitemap: included ${courses.length} course page(s).`);
  } catch (error) {
    console.warn(`generate-sitemap: could not fetch courses (${error.message}). Writing static pages only.`);
  }

  const outputPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
  writeFileSync(outputPath, buildXml(entries), "utf-8");
  console.log(`generate-sitemap: wrote ${entries.length} URL(s) to ${outputPath}`);
}

main();
