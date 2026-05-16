const PLATFORM_ORDER = ["youtube", "instagram", "tiktok", "facebook", "x", "linkedin"];

const THUMB_BY_CATEGORY = {
  Education: "🎓",
  Entertainment: "🎬",
  "Science & Technology": "💻",
  "People & Blogs": "📹",
  "Film & Animation": "🎞",
  Music: "🎵",
  Gaming: "🎮",
  Sports: "🏆",
  "News & Politics": "📰",
  Comedy: "🎭",
};

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatRelativeTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

export function buildPlatformPayload(selectedPlatforms, baseVideo) {
  return selectedPlatforms.reduce((platforms, platform) => {
    platforms[platform] = {
      status: "queued",
      views: 0,
      likes: 0,
      title: baseVideo.title,
      desc: baseVideo.description,
      tags: baseVideo.tags,
      visibility: baseVideo.visibility,
    };
    return platforms;
  }, {});
}

export function serializeConnectedAccounts(user) {
  const connectedPlatforms = user?.connectedPlatforms || {};

  return PLATFORM_ORDER.map((platform) => {
    const account = connectedPlatforms[platform] || {};

    return {
      platform,
      name: account.accountName || "",
      subs: "",
      connected: Boolean(account.connected),
      lastSync: account.connected ? formatRelativeTime(account.lastSync) : "",
    };
  });
}

export function serializeVideo(video) {
  const data = video?.toObject ? video.toObject() : video;

  return {
    id: String(data._id),
    title: data.title || "Untitled video",
    thumb: THUMB_BY_CATEGORY[data.category] || "🎬",
    thumbUrl: data.thumbnailUrl || null,
    dur: data.duration || "0:00",
    date: formatDate(data.createdAt),
    status: data.status || "draft",
    desc: data.description || "",
    tags: data.tags || [],
    visibility: data.visibility || "public",
    category: data.category || "Education",
    language: data.language || "English",
    comments: data.allowComments ?? true,
    ageRestricted: data.ageRestricted ?? false,
    license: data.license || "Standard",
    platforms: data.platforms || {},
    fileUrl: data.fileUrl || "",
    fileName: data.fileName || "",
    fileSize: data.fileSize || 0,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}
