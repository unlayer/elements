import type { Meta, StoryObj } from "@storybook/react";
import Html from "./Html";

const meta: Meta<typeof Html> = {
  title: "Components/Html",
  component: Html,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Custom HTML content with **safe rendering** and **mode-specific output**.

## Key Features
- **Custom HTML**: Raw HTML content insertion
- **Safe Rendering**: Sanitized HTML output
- **Responsive**: Mobile-optimized HTML content
- **Email-Safe**: Conservative HTML for email clients
- **Flexible**: Any HTML markup and styling

## Html Options
- **HTML Content**: Custom markup and elements
- **Styling**: Inline styles, CSS classes
- **Safety**: HTML sanitization and validation
- **Responsive**: Mobile-friendly markup

## Common Use Cases
- Custom HTML blocks in emails
- Embedded forms and widgets
- Third-party integrations
- Custom styling and layouts
- Advanced content blocks
        `
      }
    }
  },
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["web", "email", "document"],
      description:
        "**Rendering Mode** - Controls output format and html optimizations",
      table: {
        defaultValue: { summary: "web" },
        type: { summary: "RenderMode" }
      }
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with schema-driven defaults
export const Default: Story = {
  args: {
    mode: "web"
  }
};

// Styled Card - Custom card with HTML/CSS
export const StyledCard: Story = {
  args: {
    html: `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 32px;
          border-radius: 16px;
          color: white;
          text-align: center;
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
          max-width: 400px;
          margin: 0 auto;
        ">
          <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">
            Custom HTML Card
          </h2>
          <p style="margin: 0 0 20px 0; opacity: 0.9; line-height: 1.6;">
            This beautiful card is created using custom HTML and CSS with gradient backgrounds and modern styling.
          </p>
          <button style="
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            Learn More
          </button>
        </div>
      `,
    mode: "web"
  }
};

// Progress Bars - Custom progress indicators
export const ProgressBars: Story = {
  args: {
    html: `
        <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
          <h3 style="margin: 0 0 24px 0; color: #1f2937; font-size: 20px; font-weight: 600;">
            Skill Levels
          </h3>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #374151; font-weight: 500;">JavaScript</span>
              <span style="color: #6b7280; font-size: 14px;">90%</span>
            </div>
            <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); width: 90%; height: 100%; border-radius: 10px;"></div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #374151; font-weight: 500;">React</span>
              <span style="color: #6b7280; font-size: 14px;">85%</span>
            </div>
            <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #10b981, #059669); width: 85%; height: 100%; border-radius: 10px;"></div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #374151; font-weight: 500;">TypeScript</span>
              <span style="color: #6b7280; font-size: 14px;">75%</span>
            </div>
            <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #7c3aed, #5b21b6); width: 75%; height: 100%; border-radius: 10px;"></div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #374151; font-weight: 500;">CSS</span>
              <span style="color: #6b7280; font-size: 14px;">95%</span>
            </div>
            <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #f59e0b, #d97706); width: 95%; height: 100%; border-radius: 10px;"></div>
            </div>
          </div>
        </div>
      `,
    mode: "web"
  }
};

// Call To Action - Custom CTA section
export const CallToAction: Story = {
  args: {
    html: `
        <div style="
          background: #1f2937;
          color: white;
          padding: 48px 32px;
          border-radius: 12px;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(rgba(255, 255, 255, 0.18) 1px, transparent 1px);
            background-size: 18px 18px;
            opacity: 0.5;
          "></div>

          <div style="position: relative; z-index: 1;">
            <h2 style="
              margin: 0 0 16px 0;
              font-size: 32px;
              font-weight: 800;
              background: linear-gradient(135deg, #60a5fa, #a78bfa);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">
              Ready to Get Started?
            </h2>

            <p style="
              margin: 0 0 32px 0;
              font-size: 18px;
              opacity: 0.8;
              line-height: 1.6;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            ">
              Join thousands of users who are already building amazing experiences with our platform.
            </p>

            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
              <button style="
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s ease;
                box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
              ">
                Start Free Trial
              </button>

              <button style="
                background: transparent;
                color: white;
                border: 2px solid rgba(255,255,255,0.3);
                padding: 14px 30px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
              ">
                Learn More
              </button>
            </div>
          </div>
        </div>
      `,
    mode: "web"
  }
};

// Testimonial Card - Customer testimonial
export const TestimonialCard: Story = {
  args: {
    html: `
        <div style="
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -8px;
            left: 32px;
            background: white;
            padding: 0 8px;
            color: #f59e0b;
            font-size: 24px;
          ">
            Stars
          </div>

          <blockquote style="
            margin: 0 0 24px 0;
            font-size: 18px;
            line-height: 1.6;
            color: #374151;
            font-style: italic;
            position: relative;
          ">
            "This platform has completely transformed how we build and deploy our applications. The ease of use and powerful features make it indispensable for our team."
          </blockquote>

          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="
              width: 50px;
              height: 50px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea, #764ba2);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 18px;
            ">
              JS
            </div>

            <div>
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
                Jane Smith
              </div>
              <div style="color: #6b7280; font-size: 14px;">
                CTO, TechCorp Inc.
              </div>
            </div>
          </div>
        </div>
      `,
    mode: "web"
  }
};

// Statistics - Key metrics display
export const Statistics: Story = {
  args: {
    html: `
        <div style="
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 40px 32px;
          border-radius: 16px;
          max-width: 800px;
          margin: 0 auto;
        ">
          <h3 style="
            text-align: center;
            margin: 0 0 32px 0;
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
          ">
            Platform Statistics
          </h3>

          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 24px;
          ">
            <div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin-bottom: 8px;">
                1M+
              </div>
              <div style="color: #6b7280; font-weight: 500; font-size: 14px;">
                Active Users
              </div>
            </div>

            <div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="font-size: 36px; font-weight: 800; color: #10b981; margin-bottom: 8px;">
                99.9%
              </div>
              <div style="color: #6b7280; font-weight: 500; font-size: 14px;">
                Uptime
              </div>
            </div>

            <div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="font-size: 36px; font-weight: 800; color: #f59e0b; margin-bottom: 8px;">
                24/7
              </div>
              <div style="color: #6b7280; font-weight: 500; font-size: 14px;">
                Support
              </div>
            </div>

            <div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="font-size: 36px; font-weight: 800; color: #7c3aed; margin-bottom: 8px;">
                50+
              </div>
              <div style="color: #6b7280; font-weight: 500; font-size: 14px;">
                Countries
              </div>
            </div>
          </div>
        </div>
      `,
    mode: "web"
  }
};

// Email HTML - Email-safe custom content
export const EmailHtml: Story = {
  args: {
    html: `
        <div style="
          background-color: #ffffff;
          border: 1px solid #cccccc;
          border-radius: 8px;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
        ">
          <h2 style="
            color: #333333;
            font-size: 20px;
            margin: 0 0 16px 0;
            text-align: center;
          ">
            Special Offer Inside!
          </h2>

          <p style="
            color: #666666;
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 20px 0;
          ">
            Get 50% off your first month when you sign up today. This limited-time offer expires soon!
          </p>

          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td style="
                background-color: #007cba;
                border-radius: 4px;
                padding: 12px 24px;
                text-align: center;
              ">
                <a href="#" style="
                  color: #ffffff;
                  text-decoration: none;
                  font-weight: bold;
                  font-size: 16px;
                ">
                  Claim Offer Now
                </a>
              </td>
            </tr>
          </table>

          <p style="
            color: #999999;
            font-size: 12px;
            text-align: center;
            margin: 20px 0 0 0;
          ">
            *Offer valid for new customers only. Terms and conditions apply.
          </p>
        </div>
      `,
    mode: "email"
  }
};

// HTML Showcase - Various custom HTML examples
export const HtmlShowcase: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "40px",
        padding: "20px",
        background: "#f8fafc"
      }}
    >
      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Custom Styled Card
        </h3>
        <Html
          html={`
              <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 32px; border-radius: 16px; color: white; text-align: center;
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); max-width: 400px; margin: 0 auto;
              ">
                <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700;">Beautiful Card</h2>
                <p style="margin: 0; opacity: 0.9;">Custom HTML with gradients and modern styling</p>
              </div>
            `}
          mode="web"
        />
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Progress Indicators
        </h3>
        <Html
          html={`
              <div style="max-width: 400px; margin: 0 auto;">
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #374151; font-weight: 500;">React</span>
                    <span style="color: #6b7280;">90%</span>
                  </div>
                  <div style="background: #e5e7eb; border-radius: 10px; height: 8px;">
                    <div style="background: linear-gradient(90deg, #10b981, #059669); width: 90%; height: 100%; border-radius: 10px;"></div>
                  </div>
                </div>
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #374151; font-weight: 500;">TypeScript</span>
                    <span style="color: #6b7280;">75%</span>
                  </div>
                  <div style="background: #e5e7eb; border-radius: 10px; height: 8px;">
                    <div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); width: 75%; height: 100%; border-radius: 10px;"></div>
                  </div>
                </div>
              </div>
            `}
          mode="web"
        />
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Statistics Grid
        </h3>
        <Html
          html={`
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; max-width: 500px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 24px; font-weight: 800; color: #3b82f6; margin-bottom: 4px;">1M+</div>
                  <div style="color: #6b7280; font-size: 12px;">Users</div>
                </div>
                <div style="text-align: center; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 24px; font-weight: 800; color: #10b981; margin-bottom: 4px;">99.9%</div>
                  <div style="color: #6b7280; font-size: 12px;">Uptime</div>
                </div>
                <div style="text-align: center; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="font-size: 24px; font-weight: 800; color: #f59e0b; margin-bottom: 4px;">24/7</div>
                  <div style="color: #6b7280; font-size: 12px;">Support</div>
                </div>
              </div>
            `}
          mode="web"
        />
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Testimonial
        </h3>
        <Html
          html={`
              <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto;">
                <p style="margin: 0 0 16px 0; color: #374151; font-style: italic; line-height: 1.5;">
                  "Amazing platform! Easy to use and incredibly powerful."
                </p>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">J</div>
                  <div>
                    <div style="font-weight: 600; color: #1f2937;">Jane Doe</div>
                    <div style="color: #6b7280; font-size: 12px;">CEO, TechCorp</div>
                  </div>
                </div>
              </div>
            `}
          mode="web"
        />
      </div>

      <div>
        <h3
          style={{
            margin: "0 0 20px",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "700"
          }}
        >
          Email-Safe HTML
        </h3>
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px"
          }}
        >
          <Html
            html={`
                <div style="background-color: #ffffff; border: 1px solid #cccccc; border-radius: 8px; padding: 20px; max-width: 400px; margin: 0 auto; font-family: Arial, sans-serif;">
                  <h2 style="color: #333333; font-size: 18px; margin: 0 0 12px 0; text-align: center;">Special Offer!</h2>
                  <p style="color: #666666; font-size: 14px; margin: 0 0 16px 0; text-align: center;">Get 50% off your first month</p>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background-color: #007cba; border-radius: 4px; padding: 10px 20px; text-align: center;">
                        <a href="#" style="color: #ffffff; text-decoration: none; font-weight: bold;">Claim Now</a>
                      </td>
                    </tr>
                  </table>
                </div>
              `}
            mode="email"
          />
        </div>
      </div>
    </div>
  )
};
