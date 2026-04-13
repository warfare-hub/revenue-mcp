import axios from 'axios';

interface LSSubscription {
  attributes: {
    status: string;
    total: number;
    created_at: string;
  };
}

interface LSOrder {
  attributes: {
    status: string;
    total: number;
    created_at: string;
    refunded: boolean;
  };
}

export class LemonSqueezyProvider {
  private apiKey: string;
  private base = 'https://api.lemonsqueezy.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async get(path: string, params: Record<string, string | number> = {}): Promise<unknown> {
    const res = await axios.get(`${this.base}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/vnd.api+json' },
      params,
    });
    return res.data;
  }

  async getMrr(): Promise<{ mrr: number; activeSubscriptions: number }> {
    const data = await this.get('/subscriptions', {
      'filter[status]': 'active',
      'page[size]': 100,
    }) as { data: LSSubscription[] };

    const subs = data.data ?? [];
    const mrr = subs.reduce((sum, sub) => sum + (sub.attributes.total ?? 0) / 100, 0);

    return {
      mrr: Math.round(mrr * 100) / 100,
      activeSubscriptions: subs.length,
    };
  }

  async getRecentOrders(days = 30): Promise<{ total: number; count: number }> {
    const data = await this.get('/orders', { 'page[size]': 100 }) as { data: LSOrder[] };
    const orders = data.data ?? [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recent = orders.filter(
      (o) =>
        o.attributes.status === 'paid' &&
        !o.attributes.refunded &&
        new Date(o.attributes.created_at) >= cutoff
    );

    const total = recent.reduce((sum, o) => sum + (o.attributes.total ?? 0) / 100, 0);
    return { total: Math.round(total * 100) / 100, count: recent.length };
  }
}
