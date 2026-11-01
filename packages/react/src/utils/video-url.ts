/**
 * Parses a YouTube or Vimeo URL and returns exporter-ready video data: the URL itself too, which an email's thumbnail
 * links to and its plain text lists (as the editor's design holds it).
 */
export function parseVideoUrl(url: string): { url: string; type: "youtube" | "vimeo"; videoId: string; thumbnail: string } | null {
  // YouTube: youtube.com/watch?v=ID (its `v` after other parameters too), youtu.be/ID, youtube.com/embed/ID, /shorts/ID,
  // /live/ID, /v/ID, youtube-nocookie.com/embed/ID
  const ytMatch = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*?&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      url,
      type: "youtube",
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
    };
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      url,
      type: "vimeo",
      videoId: vimeoMatch[1],
      thumbnail: "",
    };
  }

  return null;
}
