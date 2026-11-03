/**
 * The stories of today's components and of their config (UnlayerProvider), each rendered both ways: as today's
 * components render it, and through the new engine. A story of blocks is in an Email and on a Page (see story.tsx).
 * Left out: CompletePixelParityTest, an interactive story whose render uses React state (its template is
 * Body.stories' and the examples'). The comparison gate (test:compare) checks each pair at desktop and phone widths.
 */
import type { Meta } from "@storybook/react-vite";
import * as body from "../components/Body.stories";
import * as button from "../components/Button.stories";
import * as column from "../components/Column.stories";
import * as customTools from "../components/CustomTools.stories";
import * as customToolsExamples from "../components/CustomToolsExamples.stories";
import * as divider from "../components/Divider.stories";
import * as heading from "../components/Heading.stories";
import * as html from "../components/Html.stories";
import * as image from "../components/Image.stories";
import * as menu from "../components/Menu.stories";
import * as paragraph from "../components/Paragraph.stories";
import * as row from "../components/Row.stories";
import * as social from "../components/Social.stories";
import * as table from "../components/Table.stories";
import * as video from "../components/Video.stories";
import * as unlayerProvider from "../context/UnlayerProvider.stories";
import { args, argTypes, shadow, type Allowance, type Args } from "./story";

/**
 * Rounded corners at a fraction of a px, on phones: Chromium antialiases them a little differently in the two frames
 * even where both hold main's own HTML (these stories fail main against itself, 10 to 12 pixels at the corners' edges).
 */
const CORNERS: Allowance = { x: 3, y: 3, why: "rounded corners at a fraction of a px, which Chromium antialiases differently in the two frames even for main's own HTML" };

const meta: Meta<Args> = {
  title: "Primitives/Main through the new engine/Components",
  args,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Each story of today's components rendered by them, next to the same template rendered by the new engine (RFC 0001, step 7).",
      },
    },
  },
};
export default meta;

export const BodyPlayground = shadow(body, "Playground");
export const BodyReceipt = shadow(body, "Receipt");
export const BodySaaSLanding = shadow(body, "SaaSLanding");
export const BodyEcommerce = shadow(body, "Ecommerce");
export const BodyMagazine = shadow(body, "Magazine");
export const BodyNewsletter = shadow(body, "Newsletter");
export const ButtonSimpleButtonInEmail = shadow(button, "SimpleButton", "email");
export const ButtonSimpleButtonOnPage = shadow(button, "SimpleButton", "web");
export const ButtonWithSemanticPropsInEmail = shadow(button, "WithSemanticProps", "email");
export const ButtonWithSemanticPropsOnPage = shadow(button, "WithSemanticProps", "web");
export const ButtonWithLinkAndHoverInEmail = shadow(button, "WithLinkAndHover", "email");
export const ButtonWithLinkAndHoverOnPage = shadow(button, "WithLinkAndHover", "web");
export const ButtonMobileButtonInEmail = shadow(button, "MobileButton", "email", CORNERS);
export const ButtonMobileButtonOnPage = shadow(button, "MobileButton", "web");
export const ButtonEmailSafeButtonInEmail = shadow(button, "EmailSafeButton", "email");
export const ButtonLinkStringUrlInEmail = shadow(button, "LinkStringUrl", "email");
export const ButtonLinkStringUrlOnPage = shadow(button, "LinkStringUrl", "web");
export const ButtonLinkConfigObjectInEmail = shadow(button, "LinkConfigObject", "email");
export const ButtonLinkConfigObjectOnPage = shadow(button, "LinkConfigObject", "web");
export const ButtonLinkEmailInEmail = shadow(button, "LinkEmail", "email");
export const ButtonLinkEmailOnPage = shadow(button, "LinkEmail", "web");
export const ButtonLinkPhoneInEmail = shadow(button, "LinkPhone", "email", CORNERS);
export const ButtonLinkPhoneOnPage = shadow(button, "LinkPhone", "web", CORNERS);
export const ButtonLinkEmailModeInEmail = shadow(button, "LinkEmailMode", "email");
export const ButtonButtonShowcaseInEmail = shadow(button, "ButtonShowcase", "email");
export const ButtonButtonShowcaseOnPage = shadow(button, "ButtonShowcase", "web");
export const ColumnPlayground = shadow(column, "Playground");
export const ColumnPricingCards = shadow(column, "PricingCards");
export const ColumnFeatureShowcase = shadow(column, "FeatureShowcase");
export const ColumnTestimonialCards = shadow(column, "TestimonialCards");
export const ColumnSidebarArticle = shadow(column, "SidebarArticle");
export const ColumnStatsBar = shadow(column, "StatsBar");
export const CustomToolsCountdownTool = shadow(customTools, "CountdownTool", undefined, CORNERS);
export const CustomToolsCountdownCustomized = shadow(customTools, "CountdownCustomized");
export const CustomToolsProductCardTool = shadow(customTools, "ProductCardTool");
export const CustomToolsInsideAFullDesign = shadow(customTools, "InsideAFullDesign", undefined, CORNERS);
export const CustomToolsExamplesAccordionTool = shadow(customToolsExamples, "AccordionTool");
export const CustomToolsExamplesTabsTool = shadow(customToolsExamples, "TabsTool");
export const CustomToolsExamplesTwoIndependentAccordions = shadow(customToolsExamples, "TwoIndependentAccordions");
export const CustomToolsExamplesEmailAdaptations = shadow(customToolsExamples, "EmailAdaptations");
export const CustomToolsExamplesProductLibraryTool = shadow(customToolsExamples, "ProductLibraryTool");
export const CustomToolsExamplesQrCodeTool = shadow(customToolsExamples, "QrCodeTool");
export const CustomToolsExamplesMapTool = shadow(customToolsExamples, "MapTool");
export const DividerDefaultInEmail = shadow(divider, "Default", "email");
export const DividerDefaultOnPage = shadow(divider, "Default", "web");
export const DividerCustomBorderInEmail = shadow(divider, "CustomBorder", "email");
export const DividerCustomBorderOnPage = shadow(divider, "CustomBorder", "web");
export const DividerDashedInEmail = shadow(divider, "Dashed", "email");
export const DividerDashedOnPage = shadow(divider, "Dashed", "web");
export const DividerThickAccentInEmail = shadow(divider, "ThickAccent", "email");
export const DividerThickAccentOnPage = shadow(divider, "ThickAccent", "web");
export const DividerEmailModeInEmail = shadow(divider, "EmailMode", "email");
export const DividerDividerShowcaseInEmail = shadow(divider, "DividerShowcase", "email");
export const DividerDividerShowcaseOnPage = shadow(divider, "DividerShowcase", "web");
export const HeadingSimpleHeadingInEmail = shadow(heading, "SimpleHeading", "email");
export const HeadingSimpleHeadingOnPage = shadow(heading, "SimpleHeading", "web");
export const HeadingWithSemanticPropsInEmail = shadow(heading, "WithSemanticProps", "email");
export const HeadingWithSemanticPropsOnPage = shadow(heading, "WithSemanticProps", "web");
export const HeadingMultipleHeadingLevelsInEmail = shadow(heading, "MultipleHeadingLevels", "email");
export const HeadingMultipleHeadingLevelsOnPage = shadow(heading, "MultipleHeadingLevels", "web");
export const HeadingDefaultOnPage = shadow(heading, "Default", "web");
export const HeadingH1HeadingOnPage = shadow(heading, "H1Heading", "web");
export const HeadingH2HeadingOnPage = shadow(heading, "H2Heading", "web");
export const HeadingH3HeadingOnPage = shadow(heading, "H3Heading", "web");
export const HeadingH4HeadingOnPage = shadow(heading, "H4Heading", "web");
export const HeadingColoredHeadingOnPage = shadow(heading, "ColoredHeading", "web");
export const HeadingGradientHeadingOnPage = shadow(heading, "GradientHeading", "web");
export const HeadingEmailHeadingInEmail = shadow(heading, "EmailHeading", "email");
export const HeadingLinkedHeadingOnPage = shadow(heading, "LinkedHeading", "web");
export const HeadingCorporateHeadingOnPage = shadow(heading, "CorporateHeading", "web");
export const HeadingHeadingHierarchyInEmail = shadow(heading, "HeadingHierarchy", "email");
export const HeadingHeadingHierarchyOnPage = shadow(heading, "HeadingHierarchy", "web");
export const HtmlDefaultOnPage = shadow(html, "Default", "web");
export const HtmlStyledCardOnPage = shadow(html, "StyledCard", "web");
export const HtmlProgressBarsOnPage = shadow(html, "ProgressBars", "web");
export const HtmlCallToActionOnPage = shadow(html, "CallToAction", "web");
export const HtmlTestimonialCardOnPage = shadow(html, "TestimonialCard", "web");
export const HtmlStatisticsOnPage = shadow(html, "Statistics", "web");
export const HtmlEmailHtmlInEmail = shadow(html, "EmailHtml", "email");
export const HtmlHtmlShowcaseInEmail = shadow(html, "HtmlShowcase", "email");
export const HtmlHtmlShowcaseOnPage = shadow(html, "HtmlShowcase", "web");
export const ImageDefaultOnPage = shadow(image, "Default", "web");
export const ImageHeroImageOnPage = shadow(image, "HeroImage", "web");
export const ImageAvatarImageOnPage = shadow(image, "AvatarImage", "web");
export const ImageProductImageOnPage = shadow(image, "ProductImage", "web");
export const ImageThumbnailImageOnPage = shadow(image, "ThumbnailImage", "web");
export const ImageStyledImageOnPage = shadow(image, "StyledImage", "web");
export const ImageEmailImageInEmail = shadow(image, "EmailImage", "email");
export const ImageMobileImageOnPage = shadow(image, "MobileImage", "web");
export const ImageLogoImageOnPage = shadow(image, "LogoImage", "web");
export const ImageImageShowcaseInEmail = shadow(image, "ImageShowcase", "email");
export const ImageImageShowcaseOnPage = shadow(image, "ImageShowcase", "web");
export const MenuDefaultInEmail = shadow(menu, "Default", "email");
export const MenuDefaultOnPage = shadow(menu, "Default", "web");
export const MenuFullPropsAPIInEmail = shadow(menu, "FullPropsAPI", "email");
export const MenuFullPropsAPIOnPage = shadow(menu, "FullPropsAPI", "web");
export const MenuEmailHeader = shadow(menu, "EmailHeader");
export const MenuFooterLinks = shadow(menu, "FooterLinks");
export const MenuStyledNavigation = shadow(menu, "StyledNavigation");
export const ParagraphSimpleTextInEmail = shadow(paragraph, "SimpleText", "email");
export const ParagraphSimpleTextOnPage = shadow(paragraph, "SimpleText", "web");
export const ParagraphWithSemanticPropsInEmail = shadow(paragraph, "WithSemanticProps", "email");
export const ParagraphWithSemanticPropsOnPage = shadow(paragraph, "WithSemanticProps", "web");
export const ParagraphStyledParagraphInEmail = shadow(paragraph, "StyledParagraph", "email");
export const ParagraphStyledParagraphOnPage = shadow(paragraph, "StyledParagraph", "web");
export const ParagraphArticleParagraphInEmail = shadow(paragraph, "ArticleParagraph", "email");
export const ParagraphArticleParagraphOnPage = shadow(paragraph, "ArticleParagraph", "web");
export const ParagraphEmailParagraphInEmail = shadow(paragraph, "EmailParagraph", "email");
export const ParagraphCalloutParagraphInEmail = shadow(paragraph, "CalloutParagraph", "email");
export const ParagraphCalloutParagraphOnPage = shadow(paragraph, "CalloutParagraph", "web");
export const ParagraphLongContentInEmail = shadow(paragraph, "LongContent", "email");
export const ParagraphLongContentOnPage = shadow(paragraph, "LongContent", "web");
export const RowPlayground = shadow(row, "Playground");
export const RowHeroBanner = shadow(row, "HeroBanner");
export const RowFeatureHighlight = shadow(row, "FeatureHighlight");
export const RowServiceCards = shadow(row, "ServiceCards");
export const RowProductShowcase = shadow(row, "ProductShowcase");
export const RowEditorialWithStats = shadow(row, "EditorialWithStats");
export const SocialDefaultOnPage = shadow(social, "Default", "web");
export const SocialSocialMediaBarOnPage = shadow(social, "SocialMediaBar", "web");
export const SocialColorfulSocialIconsOnPage = shadow(social, "ColorfulSocialIcons", "web");
export const SocialRoundedSocialIconsOnPage = shadow(social, "RoundedSocialIcons", "web");
export const SocialSquaredSocialIconsOnPage = shadow(social, "SquaredSocialIcons", "web");
export const SocialEmailSocialIconsInEmail = shadow(social, "EmailSocialIcons", "email");
export const TableDefaultOnPage = shadow(table, "Default", "web");
export const TableProductTableOnPage = shadow(table, "ProductTable", "web");
export const TablePricingTableOnPage = shadow(table, "PricingTable", "web");
export const TableDataTableOnPage = shadow(table, "DataTable", "web");
export const TableEmailTableInEmail = shadow(table, "EmailTable", "email");
export const TableFeatureComparisonOnPage = shadow(table, "FeatureComparison", "web");
export const TableTableShowcaseInEmail = shadow(table, "TableShowcase", "email");
export const TableTableShowcaseOnPage = shadow(table, "TableShowcase", "web");
export const VideoDefaultOnPage = shadow(video, "Default", "web");
export const VideoFullPropsAPIOnPage = shadow(video, "FullPropsAPI", "web");
export const VideoProductDemo = shadow(video, "ProductDemo");
export const VideoYouTubeEmbedOnPage = shadow(video, "YouTubeEmbed", "web");
export const VideoEmailVideoInEmail = shadow(video, "EmailVideo", "email");
export const UnlayerProviderModeCascading = shadow(unlayerProvider, "ModeCascading");
export const UnlayerProviderBeforeProvider = shadow(unlayerProvider, "BeforeProvider");
export const UnlayerProviderAfterProvider = shadow(unlayerProvider, "AfterProvider");
export const UnlayerProviderSocialWithCDN = shadow(unlayerProvider, "SocialWithCDN");
export const UnlayerProviderTableWithMergeTags = shadow(unlayerProvider, "TableWithMergeTags");
export const UnlayerProviderBackwardCompatible = shadow(unlayerProvider, "BackwardCompatible");
export const UnlayerProviderModeOverride = shadow(unlayerProvider, "ModeOverride");
export const UnlayerProviderFullEmailTemplate = shadow(unlayerProvider, "FullEmailTemplate");
