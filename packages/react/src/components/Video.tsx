import { VideoExporters, VideoDefaults } from "@unlayer/exporters";
import type { VideoValues } from "../types";
import { createItemComponent, type ItemComponentProps } from "../utils/create-component";
import { mapSemanticProps, type SemanticProps } from "../utils/semantic-props";

type VideoSemanticProps = SemanticProps<VideoValues> & {
  /** YouTube/Vimeo URL (auto-parsed) */
  videoUrl?: string;
};

export interface VideoProps extends ItemComponentProps<SemanticProps<VideoValues>> {
  videoUrl?: string;
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
 */
export function parseVideoUrl(url: string): { type: "youtube" | "vimeo"; videoId: string; thumbnail: string } | null {
  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
    };
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      videoId: vimeoMatch[1],
      thumbnail: "",
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
        base.video = { ...DEFAULT_VIDEO, ...parsed };
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
