import { useEffect } from "react";

const SITE_URL = "https://edu.siasoftwareinnovations.com";

function setMetaByName(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(path) {
  const href = `${SITE_URL}${path}`;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return href;
}

// Sets the browser tab title, meta description, canonical link, and Open
// Graph tags for the current route. Each page is responsible for calling
// this with its own values - without it every route shares whatever the
// previous page (or index.html's defaults) left behind.
export function useDocumentMeta({ title, description, path }) {
  useEffect(() => {
    if (title) {
      document.title = title;
      setMetaByProperty("og:title", title);
    }
    if (description) {
      setMetaByName("description", description);
      setMetaByProperty("og:description", description);
    }
    if (path) {
      const canonicalUrl = setCanonical(path);
      setMetaByProperty("og:url", canonicalUrl);
    }
  }, [title, description, path]);
}
