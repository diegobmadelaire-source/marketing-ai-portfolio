# Shopify MCP for Claude

Remote MCP bridge for the Shopify store `wd08d1-gd.myshopify.com`.

## Claude Free limitation

Claude Free supports **one custom remote MCP connector**. It does not include computer-use control; the Shopify integration therefore works through the Shopify Admin API rather than mouse/keyboard automation.

## Netlify environment variables

Set these as Netlify environment variables for the MCP site's Functions/Runtime scope:

- `SHOPIFY_STORE_DOMAIN=wd08d1-gd.myshopify.com`
- `SHOPIFY_API_VERSION=2026-10`
- `SHOPIFY_CLIENT_ID=<Shopify Dev Dashboard Client ID>`
- `SHOPIFY_CLIENT_SECRET=<Shopify Dev Dashboard Client Secret>`
- `MCP_API_KEY=<random secret used by Claude as Bearer auth>`

Never commit the client secret or MCP API key.

## Deploy

Create a Netlify project whose base directory is `automation/shopify-claude-mcp`. The MCP endpoint is `/mcp`.

After deployment, use the site's HTTPS URL plus `/mcp` as Claude's custom connector URL.

In Claude, choose **No sign in** and add an `Authorization` request header using the `Bearer <MCP_API_KEY>` value.

## Current tools

Products, product variants, inventory adjustments, orders, customers, themes, and theme file read/write are exposed through Shopify's GraphQL Admin API.

Theme-file writes require Shopify's `write_themes` scope and Shopify's separate exemption for `themeFilesUpsert`/theme file mutations.
