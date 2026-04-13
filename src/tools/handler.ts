import { StripeProvider } from '../providers/stripe.js';
import { GumroadProvider } from '../providers/gumroad.js';
import { LemonSqueezyProvider } from '../providers/lemonsqueezy.js';

interface Providers {
  stripe: StripeProvider | null;
  gumroad: GumroadProvider | null;
  lemonsqueezy: LemonSqueezyProvider | null;
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  providers: Providers
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const text = await dispatch(name, args, providers);
  return { content: [{ type: 'text', text }] };
}

async function dispatch(
  name: string,
  args: Record<string, unknown>,
  { stripe, gumroad, lemonsqueezy }: Providers
): Promise<string> {
  switch (name) {
    case 'get_revenue_summary': {
      const lines: string[] = ['## Revenue Summary\n'];
      let totalMrr = 0;

      if (stripe) {
        const m = await stripe.getMrr();
        totalMrr += m.mrr;
        lines.push('### Stripe');
        lines.push(`- MRR: ${fmt(m.mrr)}`);
        lines.push(`- ARR: ${fmt(m.arr)}`);
        lines.push(`- New MRR (this month): ${fmt(m.newMrr)}`);
        lines.push(`- Churned MRR (this month): ${fmt(m.churnedMrr)}`);
        lines.push(`- Net New MRR: ${fmt(m.netNewMrr)}`);
        lines.push(`- Active subscriptions: ${m.activeSubscriptions}\n`);
      }

      if (gumroad) {
        const g = await gumroad.getSummary();
        lines.push('### Gumroad');
        lines.push(`- Total revenue (all time): ${fmt(g.totalRevenue)}`);
        lines.push(`- Total sales: ${g.totalSales}\n`);
      }

      if (lemonsqueezy) {
        const l = await lemonsqueezy.getMrr();
        totalMrr += l.mrr;
        lines.push('### Lemon Squeezy');
        lines.push(`- MRR: ${fmt(l.mrr)}`);
        lines.push(`- Active subscriptions: ${l.activeSubscriptions}\n`);
      }

      if (!stripe && !gumroad && !lemonsqueezy) {
        return 'No platforms connected. Set STRIPE_SECRET_KEY, GUMROAD_ACCESS_TOKEN, or LEMONSQUEEZY_API_KEY in your MCP config.';
      }

      lines.push(`---\n**Combined MRR: ${fmt(totalMrr)}**`);
      return lines.join('\n');
    }

    case 'get_mrr_by_platform': {
      const rows = ['Platform | MRR | Subscriptions', '---------|-----|---------------'];
      let connected = false;

      if (stripe) {
        const m = await stripe.getMrr();
        rows.push(`Stripe | ${fmt(m.mrr)} | ${m.activeSubscriptions}`);
        connected = true;
      }
      if (lemonsqueezy) {
        const l = await lemonsqueezy.getMrr();
        rows.push(`Lemon Squeezy | ${fmt(l.mrr)} | ${l.activeSubscriptions}`);
        connected = true;
      }

      if (!connected) return 'No subscription platforms connected.';
      return rows.join('\n');
    }

    case 'get_product_breakdown': {
      if (!stripe) return 'Product breakdown requires Stripe (STRIPE_SECRET_KEY).';
      const products = await stripe.getProductBreakdown();
      if (products.length === 0) return 'No active subscription products found in Stripe.';
      const rows = ['Product | MRR | Subscribers', '--------|-----|------------'];
      for (const p of products) {
        rows.push(`${p.name} | ${fmt(p.mrr)} | ${p.subscribers}`);
      }
      return rows.join('\n');
    }

    case 'get_recent_revenue': {
      const days = typeof args.days === 'number' ? args.days : 30;
      const lines: string[] = [`## Revenue — last ${days} days\n`];
      let total = 0;

      if (stripe) {
        const r = await stripe.getRecentRevenue(days);
        lines.push(`- Stripe: ${fmt(r.total)} (${r.count} charges)`);
        total += r.total;
      }
      if (gumroad) {
        const r = await gumroad.getRecentSales(days);
        lines.push(`- Gumroad: ${fmt(r.total)} (${r.count} sales)`);
        total += r.total;
      }
      if (lemonsqueezy) {
        const r = await lemonsqueezy.getRecentOrders(days);
        lines.push(`- Lemon Squeezy: ${fmt(r.total)} (${r.count} orders)`);
        total += r.total;
      }

      if (!stripe && !gumroad && !lemonsqueezy) return 'No platforms connected.';

      lines.push(`\n**Total: ${fmt(total)}**`);
      return lines.join('\n');
    }

    case 'get_churn_summary': {
      if (!stripe) return 'Churn data requires Stripe (STRIPE_SECRET_KEY).';
      const m = await stripe.getMrr();
      return [
        '## Churn Summary (this month)',
        `- Churned MRR: ${fmt(m.churnedMrr)}`,
        `- New MRR: ${fmt(m.newMrr)}`,
        `- Net New MRR: ${fmt(m.netNewMrr)}`,
        `- Current MRR: ${fmt(m.mrr)}`,
        m.mrr > 0
          ? `- Churn rate: ${((m.churnedMrr / m.mrr) * 100).toFixed(1)}%`
          : '- Churn rate: N/A (no MRR)',
      ].join('\n');
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
