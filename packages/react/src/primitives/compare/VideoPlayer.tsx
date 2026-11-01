/**
 * main's Video story (Components/Video), in an email and on a page, and the same video with the new Video: main's
 * `videoUrl` is `src`. On a page both are the video's player; in an email, its thumbnail, which the new Video links
 * to the video (main's isn't a link: a reader can't open the video from it).
 */
import { Column as MainColumn, Email as MainEmail, Page as MainPage, Row as MainRow, Video as MainVideo } from "../../index";
import { Email, Page, Section, Video } from "../index";

const SRC = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

export const email = {
  main: (
    <MainEmail contentWidth="600px">
      <MainRow>
        <MainColumn>
          <MainVideo videoUrl={SRC} />
        </MainColumn>
      </MainRow>
    </MainEmail>
  ),
  next: (
    <Email width={600}>
      <Section style={{ padding: 10 }}>
        <Video src={SRC} />
      </Section>
    </Email>
  ),
};

/** The page; `asMain` adds the browser's 8px margin around the body, which main's page keeps (its content is that much narrower and lower). */
const pageOf = (asMain: boolean) => (
  <Page width={600}>
    <Section style={{ padding: asMain ? [18, 10] : 10 }} mobile={asMain ? { padding: 18 } : undefined}>
      <Video src={SRC} />
    </Section>
  </Page>
);

export const page = {
  quirks: "its page keeps the browser's 8px margin around the body.",
  nextAsMain: pageOf(true),
  main: (
    <MainPage contentWidth="600px">
      <MainRow>
        <MainColumn>
          <MainVideo videoUrl={SRC} />
        </MainColumn>
      </MainRow>
    </MainPage>
  ),
  next: pageOf(false),
};
