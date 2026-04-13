# Revenue MCP

Query your MRR, churn, and revenue from **Stripe, Gumroad, and Lemon Squeezy** directly inside Claude.

No more switching tabs. Ask Claude "what's my MRR this month?" and get the answer in context.

## Supported Platforms

| Platform | MRR | Churn | Product Breakdown | Recent Revenue |
|----------|-----|-------|------------------|----------------|
| Stripe | ✅ | ✅ | ✅ | ✅ |
| Gumroad | — | — | ✅ | ✅ |
| Lemon Squeezy | ✅ | — | — | ✅ |
| Paddle | 🔜 | 🔜 | 🔜 | 🔜 |
| Polar | 🔜 | 🔜 | 🔜 | 🔜 |

## Quick Start

### 1. Get your API keys

- **Stripe**: Dashboard → Developers → API keys → Secret key
- **Gumroad**: Settings → Advanced → Applications → Generate access token
- **Lemon Squeezy**: Settings → API → Create key

### 2. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "revenue-mcp": {
      "command": "npx",
      "args": ["-y", "revenue-mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_live_...",
        "GUMROAD_ACCESS_TOKEN": "your_token",
        "LEMONSQUEEZY_API_KEY": "your_key"
      }
    }
  }
}
```

Restart Claude Desktop. Done.

### 3. Ask Claude anything

- "What's my MRR this month?"
- "How much did I make in the last 30 days?"
- "Which product is generating the most revenue?"
- "What's my churn rate?"
- "Break down my revenue by platform"

## Tools

| Tool | Description |
|------|-------------|
| `get_revenue_summary` | Full summary across all platforms — MRR, ARR, new MRR, churn |
| `get_mrr_by_platform` | MRR comparison table across platforms |
| `get_product_breakdown` | Revenue + subscribers per product (Stripe) |
| `get_recent_revenue` | Total revenue over last N days |
| `get_churn_summary` | Churn MRR, new MRR, net new MRR, churn rate |

## License

MIT
