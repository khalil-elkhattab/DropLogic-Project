import { NextResponse } from 'next/server';

function buildMockFinancials(keyword: string) {
  const units = Math.floor(800 + Math.random() * 3200);
  const price = 24.99 + Math.random() * 30;
  const cogsPer = price * 0.28;
  const revenue = units * price;
  const cogs = units * cogsPer;
  const adSpend = revenue * 0.3;
  const netProfit = revenue - cogs - adSpend;
  const margin = (netProfit / revenue) * 100;

  return {
    units_sold: units,
    selling_price: price,
    supplier_cost_per_unit: cogsPer,
    revenue,
    revenue_display: `$${Math.round(revenue).toLocaleString()}`,
    cogs,
    cogs_display: `$${Math.round(cogs).toLocaleString()}`,
    estimated_ad_spend: adSpend,
    estimated_ad_spend_display: `$${Math.round(adSpend).toLocaleString()}`,
    ad_spend_rate: 0.3,
    net_profit: netProfit,
    net_profit_display: `$${Math.round(netProfit).toLocaleString()}`,
    net_profit_margin_pct: margin,
    formula: 'Net Profit = Revenue - COGS - Est. Ad Spend (30%)',
    product_label: keyword,
  };
}

function buildMockTrend() {
  const scaling = Math.random() > 0.4;
  const base = 40 + Math.floor(Math.random() * 50);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const points = labels.map((label, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
    label,
    volume: scaling
      ? Math.max(12, Math.floor(base * (0.75 + i * 0.1) + Math.random() * 10))
      : Math.max(12, Math.floor(base * (1.15 - i * 0.08) + Math.random() * 8)),
  }));
  const delta = ((points[6].volume - points[0].volume) / points[0].volume) * 100;
  return {
    points,
    direction: delta >= 5 ? 'scaling' : delta <= -5 ? 'dying' : 'flat',
    delta_pct: Math.round(delta * 10) / 10,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = body.keyword || 'car diffuser';
    const market = body.market || 'US';
    const slug = keyword.replace(/\s+/g, '').toLowerCase();
    const hyphen = keyword.replace(/\s+/g, '-').toLowerCase();
    const financials = buildMockFinancials(keyword);
    const salesTrend = buildMockTrend();

    const mockSupabaseData = {
      product_name: keyword,
      analysis_id: `#DL-${Math.floor(1000 + Math.random() * 9000)}-X`,
      market,
      metrics: {
        logic_score: (7.5 + Math.random() * 2).toFixed(1),
        sentiment: `${Math.floor(70 + Math.random() * 25)}%`,
        saturation: Math.random() > 0.5 ? 'High' : 'Low',
        net_margin: `${financials.net_profit_margin_pct.toFixed(1)}%`,
      },
      financials,
      sales_trend: salesTrend,
      active_competitors: [
        {
          shop_name: `${keyword} Trends`,
          shop_url: `https://${slug}trends.com`,
          domain: `${slug}trends.com`,
          selling_price: 39.99,
          price: '$39.99',
          ad_platform: 'TikTok',
          active_ad_url: `https://www.tiktok.com/search?q=${hyphen}%20ad`,
          spend: 'High',
        },
        {
          shop_name: `Shop ${keyword}`,
          shop_url: `https://shop${slug}.com`,
          domain: `shop${slug}.com`,
          selling_price: 29.95,
          price: '$29.95',
          ad_platform: 'Meta',
          active_ad_url: `https://www.facebook.com/ads/library/?active_status=active&q=${hyphen}`,
          spend: 'Medium',
        },
      ],
      audience_phrases: [
        `This viral ${keyword} is literally blowing up on viral feeds!`,
        `Exactly what I needed for my daily routine, where is the link?`,
        `The aesthetic design of this product is top notch.`,
      ],
      raw_assets: [
        {
          id: 'DL-ASSET-01',
          title: `Viral TikTok Hook - ${keyword} Showcase`,
          duration: '0:22',
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          platform: 'TikTok',
        },
      ],
    };

    return NextResponse.json(mockSupabaseData);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
