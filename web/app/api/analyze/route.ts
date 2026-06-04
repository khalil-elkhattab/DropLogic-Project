import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = body.keyword || 'car diffuser';
    const market = body.market || 'US';

    // هنا نقوم بصياغة البيانات ومحاكاة جلب الفيديوهات الـ 4 الحقيقية والمقاييس من السيرفر أو Supabase
    const mockSupabaseData = {
      product_name: keyword,
      analysis_id: `#DL-${Math.floor(1000 + Math.random() * 9000)}-X`,
      market: market,
      metrics: {
        logic_score: (7.5 + Math.random() * 2).toFixed(1), // يولد رقم ديناميكي بين 7.5 و 9.5
        sentiment: `${Math.floor(70 + Math.random() * 25)}%`,
        saturation: Math.random() > 0.5 ? "High" : "Low",
        net_margin: `${Math.floor(60 + Math.random() * 25)}%`
      },
      intercepted_stores: [
        { domain: `try${keyword.replace(/\s+/g, '')}.com`, price: "$29.99", spend: "High" },
        { domain: `the${keyword.replace(/\s+/g, '')}co.com`, price: "$24.95", spend: "Medium" },
        { domain: `shop-${keyword.replace(/\s+/g, '-')}.net`, price: "$34.99", spend: "Low" }
      ],
      audience_phrases: [
        `This viral ${keyword} is literally blowing up on viral feeds!`,
        `Exactly what I needed for my daily routine, where is the link?`,
        `The aesthetic design of this product is top notch.`
      ],
      // حقن الـ 4 فيديوهات الحقيقية لتعرض ديناميكياً في الـ Video Studio
      raw_assets: [
        {
          id: "DL-ASSET-01",
          title: `Viral TikTok Hook - ${keyword} Showcase`,
          duration: "0:22",
          video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          platform: "TikTok"
        },
        {
          id: "DL-ASSET-02",
          title: `Meta Ads High-Conversion Creative`,
          duration: "0:15",
          video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          platform: "Meta"
        },
        {
          id: "DL-ASSET-03",
          title: `User Generated Content (UGC) Unboxing`,
          duration: "0:30",
          video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          platform: "TikTok"
        },
        {
          id: "DL-ASSET-04",
          title: `Problem vs Solution Product Demonstration`,
          duration: "0:18",
          video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          platform: "YouTube"
        }
      ]
    };

    return NextResponse.json({ data: mockSupabaseData });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}