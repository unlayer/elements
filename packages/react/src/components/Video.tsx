import { VideoExporters, VideoDefaults } from "@unlayer/exporters";
import { parseVideoUrl } from "../utils/video-url";
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
 *   video: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "youtube", videoId: "dQw4w9WgXcQ", thumbnail: "..." }
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
      const base: Partial<VideoValues> = mapSemanticProps(rest as SemanticProps<VideoValues>, DEFAULT_VALUES, "Video");
      if (parsed) {
        base.video = { ...DEFAULT_VIDEO, ...parsed };
      }
      return base;
    }

    return mapSemanticProps(props as SemanticProps<VideoValues>, DEFAULT_VALUES, "Video");
  },
  displayName: "Video",
  exporters: VideoExporters,
});

export { parseVideoUrl };
export default Video;
