#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StripeProvider } from './providers/stripe.js';
import { GumroadProvider } from './providers/gumroad.js';
import { LemonSqueezyProvider } from './providers/lemonsqueezy.js';
import { allTools } from './tools/index.js';
import { handleToolCall } from './tools/handler.js';

const server = new Server(
  { name: 'revenue-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

const providers = {
  stripe: process.env.STRIPE_SECRET_KEY
    ? new StripeProvider(process.env.STRIPE_SECRET_KEY)
    : null,
  gumroad: process.env.GUMROAD_ACCESS_TOKEN
    ? new GumroadProvider(process.env.GUMROAD_ACCESS_TOKEN)
    : null,
  lemonsqueezy: process.env.LEMONSQUEEZY_API_KEY
    ? new LemonSqueezyProvider(process.env.LEMONSQUEEZY_API_KEY)
    : null,
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return handleToolCall(request.params.name, request.params.arguments ?? {}, providers);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Revenue MCP server running');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
