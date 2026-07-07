import { VideoExporters, VideoDefaults } from "@unlayer/exporters";
import type { VideoValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type VideoSemanticProps = SemanticProps<VideoValues> & {
  /** YouTube/Vimeo URL (auto-parsed) */
  videoUrl?: string;
  /** Thumbnail image URL — overrides the parsed one; required for Vimeo,
   *  whose thumbnails need an API call Elements never makes at render time. */
  thumbnail?: string;
};

export interface VideoProps extends ItemComponentProps<SemanticProps<VideoValues>> {
  videoUrl?: string;
  /** Thumbnail image URL — overrides the parsed one; required for Vimeo. */
  thumbnail?: string;
}

// Defaults from the editor schema, plus React-specific video structure
const DEFAULT_VIDEO: NonNullable<VideoValues["video"]> = {
  type: "youtube",
  videoId: "",
  thumbnail: "",
  loading: false,
  ...VideoDefaults.video,
};

const DEFAULT_VALUES = {
  ...VideoDefaults,
  video: DEFAULT_VIDEO,
} as unknown as VideoValues;

/**
 * Parses a YouTube or Vimeo URL and returns exporter-ready video data.
 * `url` is echoed back because the email exporter links the thumbnail to it —
 * without it the email renders a dead (non-clickable) image.
 */
export function parseVideoUrl(url: string): { type: "youtube" | "vimeo"; videoId: string; thumbnail: string; url: string } | null {
  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, plus embed/shorts/live paths
  // and the youtube-nocookie.com host.
  const ytMatch = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|(?:embed|shorts|live)\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
      url,
    };
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      videoId: vimeoMatch[1],
      // Vimeo thumbnails require an API call (the editor does one); Elements
      // never fetches at render time — pass a `thumbnail` prop to set one.
      thumbnail: "",
      url,
    };
  }

  return null;
}

/**
 * Video - Renders an embedded video player (YouTube/Vimeo).
 *
 * @example Shorthand
 * ```tsx
 * <Video videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
 * ```
 *
 * @example Full Control
 * ```tsx
 * <Video values={{
 *   video: { type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "..." }
 * }} />
 * ```
 */
const Video = createItemComponent<VideoValues, VideoSemanticProps>({
  name: "Video",
  defaultValues: DEFAULT_VALUES,
  propMapper: (props) => {
    const { videoUrl, ...rest } = props;

    if (typeof videoUrl === "string") {
      const parsed = parseVideoUrl(videoUrl);
      const base: Partial<VideoValues> = mapSemanticProps(
        rest as SemanticProps<VideoValues>,
        DEFAULT_VALUES,
        "Video"
      );
      if (parsed) {
        // Video fields passed alongside videoUrl (e.g. an explicit `thumbnail`,
        // required for Vimeo) win over the parsed values.
        base.video = { ...DEFAULT_VIDEO, ...parsed, ...(base.video as object | undefined) };
      } else {
        console.warn(
          `[Unlayer] <Video videoUrl="${videoUrl}"> is not a recognized ` +
            "YouTube/Vimeo URL — the block renders the placeholder video. " +
            "Pass values={{ video: { type, videoId, thumbnail, url } }} for other providers."
        );
      }
      return base;
    }

    return mapSemanticProps(
      props as SemanticProps<VideoValues>,
      DEFAULT_VALUES,
      "Video"
    );
  },
  displayName: "Video",
  exporters: VideoExporters,
});

export default Video;
