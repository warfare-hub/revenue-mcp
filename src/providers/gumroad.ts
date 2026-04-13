import axios from 'axios';

interface GumroadProduct {
  id: string;
  name: string;
  price: number;
  recurrence?: string;
  sales_count: number;
  revenue: number;
}

interface GumroadSale {
  price: number;
  created_at: string;
}

export class GumroadProvider {
  private token: string;
  private base = 'https://api.gumroad.com/v2';

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  private async get(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const res = await axios.get(`${this.base}${path}`, {
      params: { access_token: this.token, ...params },
    });
    return res.data;
  }

  async getSummary(): Promise<{ totalRevenue: number; totalSales: number; products: GumroadProduct[] }> {
    const data = await this.get('/products') as { products: GumroadProduct[] };
    const products = data.products ?? [];

    let totalRevenue = 0;
    let totalSales = 0;

    const enriched = products.map((p) => {
      totalRevenue += (p.revenue ?? 0) / 100;
      totalSales += p.sales_count ?? 0;
      return {
        id: p.id,
        name: p.name,
        price: (p.price ?? 0) / 100,
        recurrence: p.recurrence,
        sales_count: p.sales_count,
        revenue: (p.revenue ?? 0) / 100,
      };
    });

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales,
      products: enriched,
    };
  }

  async getRecentSales(days = 30): Promise<{ total: number; count: number }> {
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const data = await this.get('/sales', { after }) as { sales: GumroadSale[] };
    const sales = data.sales ?? [];
    const total = sales.reduce((sum, s) => sum + (s.price ?? 0) / 100, 0);
    return { total: Math.round(total * 100) / 100, count: sales.length };
  }
}
