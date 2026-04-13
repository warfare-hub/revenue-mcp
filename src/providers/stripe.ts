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

    let mrr = 0;
    let activeSubscriptions = 0;

    // Paginate through all active subscriptions
    for await (const sub of this.client.subscriptions.list({
      status: 'active',
      expand: ['data.items.data.price'],
    })) {
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

    // New MRR this month — paginated
    let newMrr = 0;
    for await (const sub of this.client.subscriptions.list({
      created: { gte: startOfMonth },
      status: 'active',
      expand: ['data.items.data.price'],
    })) {
      for (const item of sub.items.data) {
        const price = item.price;
        if (!price.unit_amount) continue;
        const amount = price.unit_amount / 100;
        if (price.recurring?.interval === 'year') newMrr += amount / 12;
        else if (price.recurring?.interval === 'month') newMrr += amount;
      }
    }

    // Churned MRR this month — filter client-side
    let churnedMrr = 0;
    for await (const sub of this.client.subscriptions.list({
      status: 'canceled',
      expand: ['data.items.data.price'],
    })) {
      if (!sub.canceled_at || sub.canceled_at < startOfMonth) continue;
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
    const results: ProductRevenue[] = [];

    for await (const product of this.client.products.list({ active: true })) {
      let productMrr = 0;
      let subscribers = 0;

      for await (const price of this.client.prices.list({
        product: product.id,
        active: true,
        type: 'recurring',
      })) {
        for await (const sub of this.client.subscriptions.list({
          price: price.id,
          status: 'active',
        })) {
          subscribers++;
          if (price.unit_amount) {
            const amount = price.unit_amount / 100;
            productMrr += price.recurring?.interval === 'year' ? amount / 12 : amount;
          }
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

  async getRecentRevenue(days: number): Promise<{ total: number; count: number }> {
    const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    let total = 0;
    let count = 0;

    for await (const charge of this.client.charges.list({ created: { gte: since } })) {
      if (charge.paid && !charge.refunded) {
        total += charge.amount / 100;
        count++;
      }
    }

    return { total: Math.round(total * 100) / 100, count };
  }
}
