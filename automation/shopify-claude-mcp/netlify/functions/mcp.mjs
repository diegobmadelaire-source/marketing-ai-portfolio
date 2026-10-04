const MCP_PROTOCOL_VERSION = "2025-06-18";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function env(name) {
  const value = Netlify.env.get(name);
  if (!value) throw new Error(`Missing Netlify environment variable: ${name}`);
  return value;
}

function jsonRpc(id, result) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function jsonRpcError(id, code, message, data) {
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data === undefined ? {} : { data }) },
  }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function textResult(value, isError = false) {
  return {
    content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
    isError,
  };
}

async function shopifyToken() {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt - now > 120_000) return cachedToken;

  const shop = env("SHOPIFY_STORE_DOMAIN").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env("SHOPIFY_CLIENT_ID"),
      client_secret: env("SHOPIFY_CLIENT_SECRET"),
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(`Shopify token request failed (${response.status}): ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + ((data.expires_in ?? 86400) * 1000);
  return cachedToken;
}

async function shopifyGraphql(query, variables = {}) {
  const shop = env("SHOPIFY_STORE_DOMAIN").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const version = Netlify.env.get("SHOPIFY_API_VERSION") || "2026-10";
  const token = await shopifyToken();

  const response = await fetch(`https://${shop}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-access-token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(`Shopify GraphQL HTTP ${response.status}: ${JSON.stringify(payload)}`);
  if (payload.errors?.length) throw new Error(`Shopify GraphQL error: ${JSON.stringify(payload.errors)}`);
  return payload.data;
}

const tools = [
  {
    name: "shopify_shop_info",
    description: "Read the current Shopify shop name, domain and primary currency.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "Shop info", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_list_products",
    description: "List products with variants, prices, inventory item IDs and handles.",
    inputSchema: {
      type: "object",
      properties: {
        first: { type: "integer", minimum: 1, maximum: 100 },
        query: { type: "string" },
      },
      additionalProperties: false,
    },
    annotations: { title: "List products", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_get_product",
    description: "Get one Shopify product by GraphQL product ID.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "Get product", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_create_product",
    description: "Create a Shopify product. The product input can include title, descriptionHtml, vendor, productType, status, handle, tags, seo and productOptions.",
    inputSchema: {
      type: "object",
      required: ["product"],
      properties: { product: { type: "object", additionalProperties: true } },
      additionalProperties: false,
    },
    annotations: { title: "Create product", readOnlyHint: false, destructiveHint: false },
  },
  {
    name: "shopify_update_product",
    description: "Update a Shopify product. The product object must include its GraphQL id and may include title, descriptionHtml, vendor, productType, status, handle, tags and seo.",
    inputSchema: {
      type: "object",
      required: ["product"],
      properties: { product: { type: "object", additionalProperties: true } },
      additionalProperties: false,
    },
    annotations: { title: "Update product", readOnlyHint: false, destructiveHint: false },
  },
  {
    name: "shopify_delete_product",
    description: "Permanently delete a Shopify product and its associated data. Use only when explicitly requested.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "Delete product", readOnlyHint: false, destructiveHint: true },
  },
  {
    name: "shopify_update_variants",
    description: "Update variants for one product, including price, compare-at price, SKU and inventory settings.",
    inputSchema: {
      type: "object",
      required: ["productId", "variants"],
      properties: {
        productId: { type: "string" },
        variants: { type: "array", items: { type: "object", additionalProperties: true }, minItems: 1 },
        allowPartialUpdates: { type: "boolean" },
      },
      additionalProperties: false,
    },
    annotations: { title: "Update variants", readOnlyHint: false, destructiveHint: false },
  },
  {
    name: "shopify_adjust_inventory",
    description: "Adjust inventory quantities by delta at specific locations.",
    inputSchema: {
      type: "object",
      required: ["changes"],
      properties: {
        reason: { type: "string", default: "correction" },
        referenceDocumentUri: { type: "string" },
        changes: {
          type: "array",
          items: {
            type: "object",
            required: ["delta", "inventoryItemId", "locationId"],
            properties: {
              delta: { type: "integer" },
              inventoryItemId: { type: "string" },
              locationId: { type: "string" },
            },
            additionalProperties: false,
          },
          minItems: 1,
        },
      },
      additionalProperties: false,
    },
    annotations: { title: "Adjust inventory", readOnlyHint: false, destructiveHint: false },
  },
  {
    name: "shopify_list_orders",
    description: "Read recent Shopify orders.",
    inputSchema: {
      type: "object",
      properties: { first: { type: "integer", minimum: 1, maximum: 100 }, query: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "List orders", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_list_customers",
    description: "Read Shopify customers. Availability depends on the app's customer-data permissions.",
    inputSchema: {
      type: "object",
      properties: { first: { type: "integer", minimum: 1, maximum: 100 }, query: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "List customers", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_list_themes",
    description: "List online store themes and identify the live theme.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "List themes", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_read_theme_files",
    description: "Read theme files by filename from a specific Shopify online store theme.",
    inputSchema: {
      type: "object",
      required: ["themeId", "filenames"],
      properties: {
        themeId: { type: "string" },
        filenames: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 50 },
      },
      additionalProperties: false,
    },
    annotations: { title: "Read theme files", readOnlyHint: true, destructiveHint: false },
  },
  {
    name: "shopify_write_theme_files",
    description: "Create or overwrite Shopify theme files. Requires write_themes and Shopify's theme-file write exemption.",
    inputSchema: {
      type: "object",
      required: ["themeId", "files"],
      properties: {
        themeId: { type: "string" },
        files: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          items: {
            type: "object",
            required: ["filename", "body"],
            properties: {
              filename: { type: "string" },
              body: {
                type: "object",
                required: ["type", "value"],
                properties: { type: { type: "string", enum: ["TEXT", "BASE64", "URL"] }, value: { type: "string" } },
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    },
    annotations: { title: "Write theme files", readOnlyHint: false, destructiveHint: true },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "shopify_shop_info":
      return shopifyGraphql(`query { shop { name primaryDomain { url host } currencyCode } }`);

    case "shopify_list_products": {
      const first = Math.min(Math.max(args?.first ?? 20, 1), 100);
      const data = await shopifyGraphql(`query Products($first:Int!, $query:String) {
        products(first:$first, query:$query) {
          nodes { id title handle status vendor productType tags
            variants(first:50) { nodes { id title price compareAtPrice sku inventoryQuantity inventoryItem { id } } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`, { first, query: args?.query || null });
      return data.products;
    }

    case "shopify_get_product":
      return shopifyGraphql(`query Product($id:ID!) {
        product(id:$id) { id title handle descriptionHtml status vendor productType tags seo { title description }
          variants(first:100) { nodes { id title price compareAtPrice sku inventoryQuantity inventoryItem { id } selectedOptions { name value } } }
        }
      }`, { id: args.id });

    case "shopify_create_product":
      return shopifyGraphql(`mutation ProductCreate($product:ProductCreateInput!) {
        productCreate(product:$product) { product { id title handle status } userErrors { field message } }
      }`, { product: args.product });

    case "shopify_update_product":
      return shopifyGraphql(`mutation ProductUpdate($product:ProductUpdateInput!) {
        productUpdate(product:$product) { product { id title handle status vendor productType tags seo { title description } } userErrors { field message } }
      }`, { product: args.product });

    case "shopify_delete_product":
      return shopifyGraphql(`mutation ProductDelete($input:ProductDeleteInput!) {
        productDelete(input:$input) { deletedProductId userErrors { field message } }
      }`, { input: { id: args.id } });

    case "shopify_update_variants":
      return shopifyGraphql(`mutation ProductVariantsBulkUpdate($productId:ID!, $variants:[ProductVariantsBulkInput!]!, $allowPartialUpdates:Boolean) {
        productVariantsBulkUpdate(productId:$productId, variants:$variants, allowPartialUpdates:$allowPartialUpdates) {
          product { id title }
          productVariants { id title price compareAtPrice sku }
          userErrors { field message }
        }
      }`, { productId: args.productId, variants: args.variants, allowPartialUpdates: args.allowPartialUpdates ?? false });

    case "shopify_adjust_inventory":
      return shopifyGraphql(`mutation InventoryAdjust($input:InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input:$input) {
          inventoryAdjustmentGroup { createdAt reason referenceDocumentUri changes { name delta } }
          userErrors { field message }
        }
      }`, { input: {
        reason: args.reason || "correction",
        referenceDocumentUri: args.referenceDocumentUri || null,
        changes: args.changes,
      }});

    case "shopify_list_orders": {
      const first = Math.min(Math.max(args?.first ?? 20, 1), 100);
      const data = await shopifyGraphql(`query Orders($first:Int!, $query:String) {
        orders(first:$first, query:$query, sortKey:CREATED_AT, reverse:true) {
          nodes { id name createdAt displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } } }
          pageInfo { hasNextPage endCursor }
        }
      }`, { first, query: args?.query || null });
      return data.orders;
    }

    case "shopify_list_customers": {
      const first = Math.min(Math.max(args?.first ?? 20, 1), 100);
      const data = await shopifyGraphql(`query Customers($first:Int!, $query:String) {
        customers(first:$first, query:$query) {
          nodes { id displayName email phone createdAt numberOfOrders }
          pageInfo { hasNextPage endCursor }
        }
      }`, { first, query: args?.query || null });
      return data.customers;
    }

    case "shopify_list_themes": {
      const data = await shopifyGraphql(`query { themes(first:20) { nodes { id name role createdAt updatedAt } } }`);
      return data.themes;
    }

    case "shopify_read_theme_files":
      return shopifyGraphql(`query ThemeFiles($themeId:ID!, $filenames:[String!]!) {
        theme(id:$themeId) { id name role files(filenames:$filenames, first:50) {
          nodes { filename checksumMd5 contentType size body {
            ... on OnlineStoreThemeFileBodyText { content }
            ... on OnlineStoreThemeFileBodyBase64 { contentBase64 }
            ... on OnlineStoreThemeFileBodyUrl { url }
          } }
          userErrors { code filename }
        } }
      }`, { themeId: args.themeId, filenames: args.filenames });

    case "shopify_write_theme_files":
      return shopifyGraphql(`mutation ThemeFilesUpsert($themeId:ID!, $files:[OnlineStoreThemeFilesUpsertFileInput!]!) {
        themeFilesUpsert(themeId:$themeId, files:$files) {
          upsertedThemeFiles { filename }
          job { id }
          userErrors { field message }
        }
      }`, { themeId: args.themeId, files: args.files });

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function authorized(req) {
  const expected = env("MCP_API_KEY");
  const header = req.headers.get("authorization") || "";
  return header === `Bearer ${expected}`;
}

export default async (req) => {
  try {
    if (req.method === "GET") {
      return new Response("Shopify MCP endpoint. Use POST with MCP JSON-RPC requests.", { status: 405 });
    }
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    if (!authorized(req)) return new Response("Unauthorized", { status: 401, headers: { "www-authenticate": "Bearer" } });

    const body = await req.json();
    const { id, method, params = {} } = body;

    if (method === "notifications/initialized" || method === "notifications/cancelled") {
      return new Response(null, { status: 202 });
    }

    if (method === "initialize") {
      return jsonRpc(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "diego-shopify-mcp", version: "1.0.0" },
      });
    }

    if (method === "ping") return jsonRpc(id, {});

    if (method === "tools/list") return jsonRpc(id, { tools });

    if (method === "tools/call") {
      const name = params.name;
      if (!tools.some((tool) => tool.name === name)) return jsonRpcError(id, -32602, `Unknown tool: ${name}`);
      try {
        const result = await callTool(name, params.arguments || {});
        return jsonRpc(id, textResult(result));
      } catch (error) {
        return jsonRpc(id, textResult(error instanceof Error ? error.message : String(error), true));
      }
    }

    return jsonRpcError(id, -32601, `Method not found: ${method}`);
  } catch (error) {
    return jsonRpcError(null, -32603, error instanceof Error ? error.message : String(error));
  }
};

export const config = { path: "/mcp" };
