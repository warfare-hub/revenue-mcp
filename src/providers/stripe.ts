import Stripe from 'stripe';

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  newMrr: number;
  churnedMrr: number;
  netNewMrr: number;
  activeSubscriptions: number;
  currency: string;
}

export interface ProductRevenue {
  id: string;
  name: string;
  mrr: number;
  subscribers: number;
}

export class StripeProvider {
  private client: Stripe;

  constructor(secretKey: string) {
    this.client = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  }

  async getMrr(): Promise<RevenueMetrics> {
    const startOfMonth = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000
    );

    // All active subscriptions → current MRR
    const subscriptions = await this.client.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price'],
    });

    let mrr = 0;
    let activeSubscriptions = 0;

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (!price.unit_amount) continue;
        const amount = price.unit_amount / 100;
        if (price.recurring?.interval === 'year') mrr += amount / 12;
        else if (price.recurring?.interval === 'month') mrr += amount;
        else if (price.recurring?.interval === 'week') mrr += (amount * 52) / 12;
        activeSubscriptions++;
      }
    }

    // New MRR this month
    const newSubs = await this.client.subscriptions.list({
      created: { gte: startOfMonth },
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price'],
    });

    let newMrr = 0;
    for (const sub of newSubs.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (!price.unit_amount) continue;
        const amount = price.unit_amount / 100;
        if (price.recurring?.interval === 'year') newMrr += amount / 12;
        else if (price.recurring?.interval === 'month') newMrr += amount;
      }
    }

    // Churned MRR this month — list canceled subs and filter by canceled_at client-side
    const canceledSubs = await this.client.subscriptions.list({
      status: 'canceled',
      limit: 100,
      expand: ['data.items.data.price'],
    });
    // Filter to only subs canceled this month
    canceledSubs.data = canceledSubs.data.filter(
      (s) => s.canceled_at !== null && s.canceled_at !== undefined && s.canceled_at >= startOfMonth
    );

    let churnedMrr = 0;
    for (const sub of canceledSubs.data) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (!price.unit_amount) continue;
        const amount = price.unit_amount / 100;
        if (price.recurring?.interval === 'year') churnedMrr += amount / 12;
        else if (price.recurring?.interval === 'month') churnedMrr += amount;
      }
    }

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      newMrr: Math.round(newMrr * 100) / 100,
      churnedMrr: Math.round(churnedMrr * 100) / 100,
      netNewMrr: Math.round((newMrr - churnedMrr) * 100) / 100,
      activeSubscriptions,
      currency: 'usd',
    };
  }

  async getProductBreakdown(): Promise<ProductRevenue[]> {
    const products = await this.client.products.list({ limit: 50, active: true });
    const results: ProductRevenue[] = [];

    for (const product of products.data) {
      const prices = await this.client.prices.list({
        product: product.id,
        active: true,
        type: 'recurring',
      });

      let productMrr = 0;
      let subscribers = 0;

      for (const price of prices.data) {
        const subs = await this.client.subscriptions.list({
          price: price.id,
          status: 'active',
          limit: 100,
        });
        subscribers += subs.data.length;
        if (price.unit_amount) {
          const amount = price.unit_amount / 100;
          const monthly = price.recurring?.interval === 'year' ? amount / 12 : amount;
          productMrr += monthly * subs.data.length;
        }
      }

      if (subscribers > 0) {
        results.push({
          id: product.id,
          name: product.name,
          mrr: Math.round(productMrr * 100) / 100,
          subscribers,
        });
      }
    }

    return results.sort((a, b) => b.mrr - a.mrr);
  }

  async getRecentRevenue(days = 30): Promise<{ total: number; count: number }> {
    const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const charges = await this.client.charges.list({
      created: { gte: since },
      limit: 100,
    });
    const total = charges.data
      .filter((c) => c.paid && !c.refunded)
      .reduce((sum, c) => sum + c.amount / 100, 0);
    return { total: Math.round(total * 100) / 100, count: charges.data.length };
  }
}
