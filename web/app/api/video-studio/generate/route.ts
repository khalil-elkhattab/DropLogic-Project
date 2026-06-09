import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. استقبال البيانات القادمة من واجهة الاستوديو (Client-side)
    const body = await request.json();
    const { product_name, angle, video_url } = body;

    // التحقق الأساسي من وجود اسم المنتج لمنع إرسال طلبات فارغة للسيرفر
    if (!product_name) {
      return NextResponse.json(
        { success: false, error: "Product name is required" },
        { status: 400 }
      );
    }

    // 2. تحديد رابط خادم FastAPI (بايثون) من ملف البيئة أو محلياً كاحتياط
    const fastapiUrl = process.env.NEXT_SERVER_FASTAPI_URL || 'http://127.0.0.1:8000';
    const targetUrl = `${fastapiUrl}/api/video-studio/generate`;

    console.log(`🛰️ [Next.js API Proxy] Forwarding script generation request to Python: ${targetUrl}`);

    // 3. إرسال الطلب المطابق تماماً للـ Pydantic Model (StudioScriptRequest) المتواجد في main.py
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_name: product_name,
        angle: angle,           // 'problem_solving', 'tiktok_viral', or 'urgency'
        video_url: video_url || ""
      }),
      // تحديد مهلة زمنية تتطابق مع الـ timeout الخاص بـ OpenRouter في بايثون
      next: { revalidate: 0 } // إلغاء الكاش لضمان توليد نصوص جديدة دائماً عند طلب المستخدم
    });

    // إذا لم يستجب سيرفر البايثون بشكل طبيعي
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[-] Python Backend responded with error status: ${response.status}`, errorText);
      throw new Error(`Python server error: ${response.statusText}`);
    }

    // 4. استلام نتيجة الـ AI المنظمة كـ JSON من البايثون
    const pythonData = await response.json();

    // 5. إرجاع النتيجة فوراً إلى صفحة الاستوديو
    return NextResponse.json(pythonData);

  } catch (error: any) {
    console.error("❌ Main Next.js API Route Error:", error.message);
    
    // إرجاع استجابة Fallback آمنة ومطابقة للهيكل المتوقع في الفرونت إند في حالة انقطاع السيرفر تماماً
    return NextResponse.json({
      success: false,
      error: error.message,
      script_engine: {
        selected_angle: "fallback",
        hook_options: [
          "If you want to scale your product, you need to look at this.",
          "Stop scrolling — this product is going viral.",
          "Nobody told me about this until today.",
        ],
        hook: "If you want to scale your product, you need to look at this.",
        body: "This product is trending everywhere right now because it solves the biggest problem drop shippers face.",
        cta: "Get 50% off today only — tap the link in bio before we sell out.",
      }
    }, { status: 500 });
  }
}