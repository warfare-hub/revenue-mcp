import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const allTools: Tool[] = [
  {
    name: 'get_revenue_summary',
    description:
      'Get a full revenue summary across all connected platforms — total MRR, ARR, new MRR, churned MRR, and active subscriptions.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_mrr_by_platform',
    description: 'Get MRR broken down by each connected platform (Stripe, Lemon Squeezy).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_product_breakdown',
    description: 'Get revenue and subscriber count broken down by product (Stripe).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_recent_revenue',
    description: 'Get total revenue collected over the last N days across all platforms.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days to look back (default: 30)' },
      },
      required: [],
    },
  },
  {
    name: 'get_churn_summary',
    description: 'Get churn metrics — MRR lost this month from cancellations, churn rate.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];
