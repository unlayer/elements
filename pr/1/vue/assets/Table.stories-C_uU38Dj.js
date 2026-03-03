import{T as e}from"./Table-DIDKQtAJ.js";import"./create-component-D1merdym.js";import"./iframe-BMyXcb8A.js";import"./preload-helper-PPVm8Dsz.js";import"./index-8x7ipbY-.js";const g={title:"Components/Table",component:e,parameters:{layout:"centered",docs:{description:{component:`
# Table Component

Responsive data tables with **schema-driven styling** and **email compatibility**.

## Key Features
- **Data Display**: Structured rows and columns
- **Rich Styling**: Headers, borders, colors, spacing
- **Responsive**: Mobile-optimized table layouts
- **Email-Safe**: Conservative table markup for email clients
- **Accessibility**: Proper table semantics and ARIA

## Table Options
- **Headers**: Custom styling, colors, fonts
- **Borders**: Cell borders, table borders, custom styles
- **Colors**: Alternating rows, header colors, hover states
- **Spacing**: Cell padding, table margins, row heights

## Common Use Cases
- Data tables in reports and dashboards
- Price comparisons and feature lists
- Invoice and receipt layouts
- Product specifications and details
- Email newsletter content tables
        `}}},argTypes:{values:{description:"**Table Configuration Object**\n\nMain table options:\n- `columns`: Column definitions and headers\n- `rows`: Table data and content\n- `headerStyles`: Header styling options\n- `cellStyles`: Cell styling and formatting\n- `borderStyles`: Border and separator styling\n\n*See individual stories below for complete examples*",control:!1,table:{type:{summary:"TableValues",detail:`{
  // Table-specific properties
  // See component schema for full options
}`}}},mode:{control:{type:"select"},options:["web","email","document"],description:"**Rendering Mode** - Controls output format and table optimizations",table:{defaultValue:{summary:"web"},type:{summary:"RenderMode"}}}},tags:["autodocs"]},r={render:()=>({components:{Table:e},setup(){return{headers:["Product","Price","Stock"],data:[["Wireless Headphones","$199.99","In Stock"],["Smart Watch","$299.99","In Stock"],["Bluetooth Speaker","$79.99","Low Stock"]]}},template:`
      <Table :headers="headers" :data="data" mode="web" />
    `}),parameters:{docs:{description:{story:`**Shorthand API** -- pass \`headers\` as a string array and \`data\` as a 2D string array.

\`\`\`html
<Table
  :headers="['Product', 'Price', 'Stock']"
  :data="[
    ['Wireless Headphones', '$199.99', 'In Stock'],
    ['Smart Watch', '$299.99', 'In Stock'],
  ]"
/>
\`\`\``}}}},o={render:()=>({components:{Table:e},setup(){return{values:{table:{headers:[{cells:[{text:"Product"},{text:"Price"},{text:"Rating"},{text:"Stock"},{text:"Action"}]}],rows:[{cells:[{text:"Wireless Headphones"},{text:"$199.99"},{text:"4.8/5"},{text:"In Stock"},{text:"Buy Now"}]},{cells:[{text:"Smart Watch"},{text:"$299.99"},{text:"4.5/5"},{text:"In Stock"},{text:"Buy Now"}]},{cells:[{text:"Bluetooth Speaker"},{text:"$79.99"},{text:"4.9/5"},{text:"Low Stock"},{text:"Buy Now"}]},{cells:[{text:"Laptop Stand"},{text:"$49.99"},{text:"4.3/5"},{text:"Out of Stock"},{text:"Notify Me"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#e5e7eb"},borderRadius:"8px",headerBackgroundColor:"#f8fafc",headerColor:"#374151",headerFontSize:"14px",headerFontWeight:"600",contentColor:"#6b7280",contentFontSize:"14px",stripedRows:!0,stripedRowsBackgroundColor:"#f9fafb",cellPadding:"12px"}}},template:`
      <Table :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"E-commerce product table with striped rows, rating column, and stock status indicators."}}}},a={render:()=>({components:{Table:e},setup(){return{values:{table:{headers:[{cells:[{text:"Feature"},{text:"Basic"},{text:"Pro"},{text:"Enterprise"}]}],rows:[{cells:[{text:"Monthly Price"},{text:"$9/mo"},{text:"$29/mo"},{text:"$99/mo"}]},{cells:[{text:"Users"},{text:"Up to 5"},{text:"Up to 25"},{text:"Unlimited"}]},{cells:[{text:"Storage"},{text:"10 GB"},{text:"100 GB"},{text:"1 TB"}]},{cells:[{text:"Support"},{text:"Email"},{text:"Email + Chat"},{text:"24/7 Phone"}]},{cells:[{text:"API Access"},{text:"No"},{text:"Yes"},{text:"Yes"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#d1d5db"},borderRadius:"12px",headerBackgroundColor:"#3b82f6",headerColor:"#ffffff",headerFontSize:"16px",headerFontWeight:"600",headerTextAlign:"center",contentColor:"#374151",contentFontSize:"14px",contentTextAlign:"center",cellPadding:"16px"}}},template:`
      <Table :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"Pricing comparison table with blue header, centered content, and tier-based feature breakdown."}}}},l={render:()=>({components:{Table:e},setup(){return{values:{table:{headers:[{cells:[{text:"Month"},{text:"Visitors"},{text:"Conversions"},{text:"Revenue"},{text:"Growth"}]}],rows:[{cells:[{text:"January"},{text:"12,543"},{text:"1,254"},{text:"$25,086"},{text:"+15.2%"}]},{cells:[{text:"February"},{text:"14,201"},{text:"1,456"},{text:"$29,120"},{text:"+13.2%"}]},{cells:[{text:"March"},{text:"16,789"},{text:"1,789"},{text:"$35,780"},{text:"+18.2%"}]},{cells:[{text:"April"},{text:"15,432"},{text:"1,543"},{text:"$30,864"},{text:"-8.1%"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#e5e7eb"},headerBackgroundColor:"#1f2937",headerColor:"#ffffff",headerFontSize:"14px",headerFontWeight:"600",contentColor:"#374151",contentFontSize:"14px",contentTextAlign:"right",cellPadding:"12px 16px"}}},template:`
      <Table :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"Analytics data table with dark header, right-aligned numeric content, and growth indicators."}}}},s={render:()=>({components:{Table:e},setup(){return{values:{table:{headers:[{cells:[{text:"Item"},{text:"Quantity"},{text:"Price"}]}],rows:[{cells:[{text:"Product A"},{text:"2"},{text:"$49.98"}]},{cells:[{text:"Product B"},{text:"1"},{text:"$29.99"}]},{cells:[{text:"Shipping"},{text:"1"},{text:"$9.99"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#cccccc"},headerBackgroundColor:"#f5f5f5",headerColor:"#333333",headerFontSize:"14px",headerFontWeight:"bold",contentColor:"#666666",contentFontSize:"14px",cellPadding:"10px"}}},template:`
      <Table :values="values" mode="email" />
    `}),parameters:{docs:{description:{story:"Email-safe table with conservative styling. Uses simple borders and system colors for maximum email client compatibility."}}}},d={render:()=>({components:{Table:e},setup(){return{values:{table:{headers:[{cells:[{text:"Feature"},{text:"Starter"},{text:"Professional"},{text:"Enterprise"}]}],rows:[{cells:[{text:"Email Templates"},{text:"10"},{text:"100"},{text:"Unlimited"}]},{cells:[{text:"Custom Branding"},{text:"No"},{text:"Yes"},{text:"Yes"}]},{cells:[{text:"Analytics"},{text:"Basic"},{text:"Advanced"},{text:"Custom"}]},{cells:[{text:"A/B Testing"},{text:"No"},{text:"Yes"},{text:"Yes"}]},{cells:[{text:"Team Collaboration"},{text:"1 User"},{text:"5 Users"},{text:"Unlimited"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"2px",borderStyle:"solid",borderColor:"#7c3aed"},borderRadius:"12px",headerBackgroundColor:"#7c3aed",headerColor:"#ffffff",headerFontSize:"16px",headerFontWeight:"700",headerTextAlign:"center",contentColor:"#374151",contentFontSize:"14px",contentTextAlign:"center",stripedRows:!0,stripedRowsBackgroundColor:"#faf5ff",cellPadding:"16px"}}},template:`
      <Table :values="values" mode="web" />
    `}),parameters:{docs:{description:{story:"Feature comparison matrix with purple accent header, striped rows, and centered tier columns."}}}},n={render:()=>({components:{Table:e},setup(){return{productValues:{table:{headers:[{cells:[{text:"Product"},{text:"Price"},{text:"Stock"}]}],rows:[{cells:[{text:"Wireless Headphones"},{text:"$199"},{text:"Available"}]},{cells:[{text:"Smart Watch"},{text:"$299"},{text:"Low Stock"}]},{cells:[{text:"Bluetooth Speaker"},{text:"$79"},{text:"Available"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#e5e7eb"},headerBackgroundColor:"#f8fafc",headerColor:"#374151",headerFontWeight:"600",contentColor:"#6b7280",stripedRows:!0,stripedRowsBackgroundColor:"#f9fafb",cellPadding:"12px",borderRadius:"8px"},pricingValues:{table:{headers:[{cells:[{text:"Plan"},{text:"Price"},{text:"Features"}]}],rows:[{cells:[{text:"Basic"},{text:"$9/mo"},{text:"5 Users, 10GB"}]},{cells:[{text:"Pro"},{text:"$29/mo"},{text:"25 Users, 100GB"}]},{cells:[{text:"Enterprise"},{text:"$99/mo"},{text:"Unlimited"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#d1d5db"},headerBackgroundColor:"#3b82f6",headerColor:"#ffffff",headerFontWeight:"600",contentColor:"#374151",cellPadding:"16px",borderRadius:"8px"},analyticsValues:{table:{headers:[{cells:[{text:"Month"},{text:"Visitors"},{text:"Revenue"}]}],rows:[{cells:[{text:"Jan"},{text:"12,543"},{text:"$25,086"}]},{cells:[{text:"Feb"},{text:"14,201"},{text:"$29,120"}]},{cells:[{text:"Mar"},{text:"16,789"},{text:"$35,780"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#e5e7eb"},headerBackgroundColor:"#1f2937",headerColor:"#ffffff",headerFontWeight:"600",contentColor:"#374151",contentTextAlign:"right",cellPadding:"12px 16px"},featureValues:{table:{headers:[{cells:[{text:"Feature"},{text:"Basic"},{text:"Pro"},{text:"Enterprise"}]}],rows:[{cells:[{text:"Templates"},{text:"10"},{text:"100"},{text:"Unlimited"}]},{cells:[{text:"Branding"},{text:"No"},{text:"Yes"},{text:"Yes"}]},{cells:[{text:"Analytics"},{text:"Basic"},{text:"Advanced"},{text:"Custom"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"2px",borderStyle:"solid",borderColor:"#7c3aed"},headerBackgroundColor:"#7c3aed",headerColor:"#ffffff",headerFontWeight:"700",contentColor:"#374151",contentTextAlign:"center",stripedRows:!0,stripedRowsBackgroundColor:"#faf5ff",cellPadding:"16px",borderRadius:"12px"},emailValues:{table:{headers:[{cells:[{text:"Item"},{text:"Qty"},{text:"Price"}]}],rows:[{cells:[{text:"Product A"},{text:"2"},{text:"$49.98"}]},{cells:[{text:"Product B"},{text:"1"},{text:"$29.99"}]},{cells:[{text:"Total"},{text:"3"},{text:"$79.97"}]}]},enableHeader:!0,backgroundColor:"#ffffff",border:{borderWidth:"1px",borderStyle:"solid",borderColor:"#cccccc"},headerBackgroundColor:"#f5f5f5",headerColor:"#333333",headerFontWeight:"bold",contentColor:"#666666",cellPadding:"10px"}}},template:`
      <div style="display: flex; flex-direction: column; gap: 40px; padding: 20px; background: #f8fafc;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Product Catalog</h3>
          <Table :values="productValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Pricing Comparison</h3>
          <Table :values="pricingValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Analytics Data</h3>
          <Table :values="analyticsValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Feature Matrix</h3>
          <Table :values="featureValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Email-Safe Table</h3>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <Table :values="emailValues" mode="email" />
          </div>
        </div>
      </div>
    `}),parameters:{docs:{description:{story:"Showcase of multiple table styles: product catalog, pricing comparison, analytics data, feature matrix, and email-safe table."}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const headers = ['Product', 'Price', 'Stock'];
      const data = [['Wireless Headphones', '$199.99', 'In Stock'], ['Smart Watch', '$299.99', 'In Stock'], ['Bluetooth Speaker', '$79.99', 'Low Stock']];
      return {
        headers,
        data
      };
    },
    template: \`
      <Table :headers="headers" :data="data" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: \`**Shorthand API** -- pass \\\`headers\\\` as a string array and \\\`data\\\` as a 2D string array.

\\\`\\\`\\\`html
<Table
  :headers="['Product', 'Price', 'Stock']"
  :data="[
    ['Wireless Headphones', '$199.99', 'In Stock'],
    ['Smart Watch', '$299.99', 'In Stock'],
  ]"
/>
\\\`\\\`\\\`\`
      }
    }
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const values = {
        table: {
          headers: [{
            cells: [{
              text: 'Product'
            }, {
              text: 'Price'
            }, {
              text: 'Rating'
            }, {
              text: 'Stock'
            }, {
              text: 'Action'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Wireless Headphones'
            }, {
              text: '$199.99'
            }, {
              text: '4.8/5'
            }, {
              text: 'In Stock'
            }, {
              text: 'Buy Now'
            }]
          }, {
            cells: [{
              text: 'Smart Watch'
            }, {
              text: '$299.99'
            }, {
              text: '4.5/5'
            }, {
              text: 'In Stock'
            }, {
              text: 'Buy Now'
            }]
          }, {
            cells: [{
              text: 'Bluetooth Speaker'
            }, {
              text: '$79.99'
            }, {
              text: '4.9/5'
            }, {
              text: 'Low Stock'
            }, {
              text: 'Buy Now'
            }]
          }, {
            cells: [{
              text: 'Laptop Stand'
            }, {
              text: '$49.99'
            }, {
              text: '4.3/5'
            }, {
              text: 'Out of Stock'
            }, {
              text: 'Notify Me'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e5e7eb'
        },
        borderRadius: '8px',
        headerBackgroundColor: '#f8fafc',
        headerColor: '#374151',
        headerFontSize: '14px',
        headerFontWeight: '600',
        contentColor: '#6b7280',
        contentFontSize: '14px',
        stripedRows: true,
        stripedRowsBackgroundColor: '#f9fafb',
        cellPadding: '12px'
      };
      return {
        values
      };
    },
    template: \`
      <Table :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'E-commerce product table with striped rows, rating column, and stock status indicators.'
      }
    }
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const values = {
        table: {
          headers: [{
            cells: [{
              text: 'Feature'
            }, {
              text: 'Basic'
            }, {
              text: 'Pro'
            }, {
              text: 'Enterprise'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Monthly Price'
            }, {
              text: '$9/mo'
            }, {
              text: '$29/mo'
            }, {
              text: '$99/mo'
            }]
          }, {
            cells: [{
              text: 'Users'
            }, {
              text: 'Up to 5'
            }, {
              text: 'Up to 25'
            }, {
              text: 'Unlimited'
            }]
          }, {
            cells: [{
              text: 'Storage'
            }, {
              text: '10 GB'
            }, {
              text: '100 GB'
            }, {
              text: '1 TB'
            }]
          }, {
            cells: [{
              text: 'Support'
            }, {
              text: 'Email'
            }, {
              text: 'Email + Chat'
            }, {
              text: '24/7 Phone'
            }]
          }, {
            cells: [{
              text: 'API Access'
            }, {
              text: 'No'
            }, {
              text: 'Yes'
            }, {
              text: 'Yes'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#d1d5db'
        },
        borderRadius: '12px',
        headerBackgroundColor: '#3b82f6',
        headerColor: '#ffffff',
        headerFontSize: '16px',
        headerFontWeight: '600',
        headerTextAlign: 'center',
        contentColor: '#374151',
        contentFontSize: '14px',
        contentTextAlign: 'center',
        cellPadding: '16px'
      };
      return {
        values
      };
    },
    template: \`
      <Table :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Pricing comparison table with blue header, centered content, and tier-based feature breakdown.'
      }
    }
  }
}`,...a.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const values = {
        table: {
          headers: [{
            cells: [{
              text: 'Month'
            }, {
              text: 'Visitors'
            }, {
              text: 'Conversions'
            }, {
              text: 'Revenue'
            }, {
              text: 'Growth'
            }]
          }],
          rows: [{
            cells: [{
              text: 'January'
            }, {
              text: '12,543'
            }, {
              text: '1,254'
            }, {
              text: '$25,086'
            }, {
              text: '+15.2%'
            }]
          }, {
            cells: [{
              text: 'February'
            }, {
              text: '14,201'
            }, {
              text: '1,456'
            }, {
              text: '$29,120'
            }, {
              text: '+13.2%'
            }]
          }, {
            cells: [{
              text: 'March'
            }, {
              text: '16,789'
            }, {
              text: '1,789'
            }, {
              text: '$35,780'
            }, {
              text: '+18.2%'
            }]
          }, {
            cells: [{
              text: 'April'
            }, {
              text: '15,432'
            }, {
              text: '1,543'
            }, {
              text: '$30,864'
            }, {
              text: '-8.1%'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e5e7eb'
        },
        headerBackgroundColor: '#1f2937',
        headerColor: '#ffffff',
        headerFontSize: '14px',
        headerFontWeight: '600',
        contentColor: '#374151',
        contentFontSize: '14px',
        contentTextAlign: 'right',
        cellPadding: '12px 16px'
      };
      return {
        values
      };
    },
    template: \`
      <Table :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Analytics data table with dark header, right-aligned numeric content, and growth indicators.'
      }
    }
  }
}`,...l.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const values = {
        table: {
          headers: [{
            cells: [{
              text: 'Item'
            }, {
              text: 'Quantity'
            }, {
              text: 'Price'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Product A'
            }, {
              text: '2'
            }, {
              text: '$49.98'
            }]
          }, {
            cells: [{
              text: 'Product B'
            }, {
              text: '1'
            }, {
              text: '$29.99'
            }]
          }, {
            cells: [{
              text: 'Shipping'
            }, {
              text: '1'
            }, {
              text: '$9.99'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#cccccc'
        },
        headerBackgroundColor: '#f5f5f5',
        headerColor: '#333333',
        headerFontSize: '14px',
        headerFontWeight: 'bold',
        contentColor: '#666666',
        contentFontSize: '14px',
        cellPadding: '10px'
      };
      return {
        values
      };
    },
    template: \`
      <Table :values="values" mode="email" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Email-safe table with conservative styling. Uses simple borders and system colors for maximum email client compatibility.'
      }
    }
  }
}`,...s.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const values = {
        table: {
          headers: [{
            cells: [{
              text: 'Feature'
            }, {
              text: 'Starter'
            }, {
              text: 'Professional'
            }, {
              text: 'Enterprise'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Email Templates'
            }, {
              text: '10'
            }, {
              text: '100'
            }, {
              text: 'Unlimited'
            }]
          }, {
            cells: [{
              text: 'Custom Branding'
            }, {
              text: 'No'
            }, {
              text: 'Yes'
            }, {
              text: 'Yes'
            }]
          }, {
            cells: [{
              text: 'Analytics'
            }, {
              text: 'Basic'
            }, {
              text: 'Advanced'
            }, {
              text: 'Custom'
            }]
          }, {
            cells: [{
              text: 'A/B Testing'
            }, {
              text: 'No'
            }, {
              text: 'Yes'
            }, {
              text: 'Yes'
            }]
          }, {
            cells: [{
              text: 'Team Collaboration'
            }, {
              text: '1 User'
            }, {
              text: '5 Users'
            }, {
              text: 'Unlimited'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#7c3aed'
        },
        borderRadius: '12px',
        headerBackgroundColor: '#7c3aed',
        headerColor: '#ffffff',
        headerFontSize: '16px',
        headerFontWeight: '700',
        headerTextAlign: 'center',
        contentColor: '#374151',
        contentFontSize: '14px',
        contentTextAlign: 'center',
        stripedRows: true,
        stripedRowsBackgroundColor: '#faf5ff',
        cellPadding: '16px'
      };
      return {
        values
      };
    },
    template: \`
      <Table :values="values" mode="web" />
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Feature comparison matrix with purple accent header, striped rows, and centered tier columns.'
      }
    }
  }
}`,...d.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => ({
    components: {
      Table
    },
    setup() {
      const productValues = {
        table: {
          headers: [{
            cells: [{
              text: 'Product'
            }, {
              text: 'Price'
            }, {
              text: 'Stock'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Wireless Headphones'
            }, {
              text: '$199'
            }, {
              text: 'Available'
            }]
          }, {
            cells: [{
              text: 'Smart Watch'
            }, {
              text: '$299'
            }, {
              text: 'Low Stock'
            }]
          }, {
            cells: [{
              text: 'Bluetooth Speaker'
            }, {
              text: '$79'
            }, {
              text: 'Available'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e5e7eb'
        },
        headerBackgroundColor: '#f8fafc',
        headerColor: '#374151',
        headerFontWeight: '600',
        contentColor: '#6b7280',
        stripedRows: true,
        stripedRowsBackgroundColor: '#f9fafb',
        cellPadding: '12px',
        borderRadius: '8px'
      };
      const pricingValues = {
        table: {
          headers: [{
            cells: [{
              text: 'Plan'
            }, {
              text: 'Price'
            }, {
              text: 'Features'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Basic'
            }, {
              text: '$9/mo'
            }, {
              text: '5 Users, 10GB'
            }]
          }, {
            cells: [{
              text: 'Pro'
            }, {
              text: '$29/mo'
            }, {
              text: '25 Users, 100GB'
            }]
          }, {
            cells: [{
              text: 'Enterprise'
            }, {
              text: '$99/mo'
            }, {
              text: 'Unlimited'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#d1d5db'
        },
        headerBackgroundColor: '#3b82f6',
        headerColor: '#ffffff',
        headerFontWeight: '600',
        contentColor: '#374151',
        cellPadding: '16px',
        borderRadius: '8px'
      };
      const analyticsValues = {
        table: {
          headers: [{
            cells: [{
              text: 'Month'
            }, {
              text: 'Visitors'
            }, {
              text: 'Revenue'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Jan'
            }, {
              text: '12,543'
            }, {
              text: '$25,086'
            }]
          }, {
            cells: [{
              text: 'Feb'
            }, {
              text: '14,201'
            }, {
              text: '$29,120'
            }]
          }, {
            cells: [{
              text: 'Mar'
            }, {
              text: '16,789'
            }, {
              text: '$35,780'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#e5e7eb'
        },
        headerBackgroundColor: '#1f2937',
        headerColor: '#ffffff',
        headerFontWeight: '600',
        contentColor: '#374151',
        contentTextAlign: 'right',
        cellPadding: '12px 16px'
      };
      const featureValues = {
        table: {
          headers: [{
            cells: [{
              text: 'Feature'
            }, {
              text: 'Basic'
            }, {
              text: 'Pro'
            }, {
              text: 'Enterprise'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Templates'
            }, {
              text: '10'
            }, {
              text: '100'
            }, {
              text: 'Unlimited'
            }]
          }, {
            cells: [{
              text: 'Branding'
            }, {
              text: 'No'
            }, {
              text: 'Yes'
            }, {
              text: 'Yes'
            }]
          }, {
            cells: [{
              text: 'Analytics'
            }, {
              text: 'Basic'
            }, {
              text: 'Advanced'
            }, {
              text: 'Custom'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#7c3aed'
        },
        headerBackgroundColor: '#7c3aed',
        headerColor: '#ffffff',
        headerFontWeight: '700',
        contentColor: '#374151',
        contentTextAlign: 'center',
        stripedRows: true,
        stripedRowsBackgroundColor: '#faf5ff',
        cellPadding: '16px',
        borderRadius: '12px'
      };
      const emailValues = {
        table: {
          headers: [{
            cells: [{
              text: 'Item'
            }, {
              text: 'Qty'
            }, {
              text: 'Price'
            }]
          }],
          rows: [{
            cells: [{
              text: 'Product A'
            }, {
              text: '2'
            }, {
              text: '$49.98'
            }]
          }, {
            cells: [{
              text: 'Product B'
            }, {
              text: '1'
            }, {
              text: '$29.99'
            }]
          }, {
            cells: [{
              text: 'Total'
            }, {
              text: '3'
            }, {
              text: '$79.97'
            }]
          }]
        },
        enableHeader: true,
        backgroundColor: '#ffffff',
        border: {
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: '#cccccc'
        },
        headerBackgroundColor: '#f5f5f5',
        headerColor: '#333333',
        headerFontWeight: 'bold',
        contentColor: '#666666',
        cellPadding: '10px'
      };
      return {
        productValues,
        pricingValues,
        analyticsValues,
        featureValues,
        emailValues
      };
    },
    template: \`
      <div style="display: flex; flex-direction: column; gap: 40px; padding: 20px; background: #f8fafc;">
        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Product Catalog</h3>
          <Table :values="productValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Pricing Comparison</h3>
          <Table :values="pricingValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Analytics Data</h3>
          <Table :values="analyticsValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Feature Matrix</h3>
          <Table :values="featureValues" mode="web" />
        </div>

        <div>
          <h3 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 700;">Email-Safe Table</h3>
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <Table :values="emailValues" mode="email" />
          </div>
        </div>
      </div>
    \`
  }),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of multiple table styles: product catalog, pricing comparison, analytics data, feature matrix, and email-safe table.'
      }
    }
  }
}`,...n.parameters?.docs?.source}}};const C=["Default","ProductTable","PricingTable","DataTable","EmailTable","FeatureComparison","TableShowcase"];export{l as DataTable,r as Default,s as EmailTable,d as FeatureComparison,a as PricingTable,o as ProductTable,n as TableShowcase,C as __namedExportsOrder,g as default};
