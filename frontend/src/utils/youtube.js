const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeVideoId(youtubeUrl) {
  const trimmed = String(youtubeUrl || "").trim();
  if (!trimmed) {
    return "";
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "";
  }

  const host = parsed.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");

  if (host === "youtu.be") {
    const candidate = parsed.pathname.replace(/^\//, "").split("/")[0];
    return VIDEO_ID_PATTERN.test(candidate) ? candidate : "";
  }

  if (host.endsWith("youtube.com")) {
    const vParam = parsed.searchParams.get("v");
    if (vParam && VIDEO_ID_PATTERN.test(vParam)) {
      return vParam;
    }
    for (const prefix of ["/embed/", "/shorts/", "/live/"]) {
      if (parsed.pathname.startsWith(prefix)) {
        const candidate = parsed.pathname.slice(prefix.length).split("/")[0];
        return VIDEO_ID_PATTERN.test(candidate) ? candidate : "";
      }
    }
  }

  return "";
}

export function extractYoutubeThumbnail(youtubeUrl) {
  const videoId = extractYoutubeVideoId(youtubeUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}
