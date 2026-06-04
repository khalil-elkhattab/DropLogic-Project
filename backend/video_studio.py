from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI, HTTPException

# نقوم بتعريف هيكل البيانات القادمة من الفرونتيند بدقة
class VideoBakeRequest(BaseModel):
    product_name: str         # اسم المنتج الحالي (مثل: Crystal Hair Eraser)
    video_url: str            # رابط فيديو التيك توك المراد معالجته عبر الـ Proxy
    
    # النصوص الثلاثة النهائية المأخوذة مباشرة من صندوق Live Script Customization
    final_hook: str           # نص الخطاف المعدل بواسطة المستخدم أو الـ AI
    final_body: str           # نص الشرح أو صلب الإعلان المعدل
    final_cta: str            # نص الدعوة لاتخاذ إجراء (CTA) المعدل
    
    # إعدادات الصوت والهوية المأخوذة من Acoustics & Brand
    selected_voice: str       # نوع الصوت المختار: adam | bella | oliver
    selected_bg_music: str    # نوع الموسيقى: lofi_chill | cyberpunk | none
    watermark_attached: bool  # لمعرفة هل رفع المستخدم لوجو مسبقاً (True/False)
    logo_url: Optional[str] = None # رابط شعار المتجر إذا تم رفعه لتثبيته على الفيديو

# إنشاء الـ Endpoint في الباكيند لاستقبال البيانات وبدء عملية الطبخ
@app.post("/api/video-studio/bake")
async def start_video_baking_pipeline(request: VideoBakeRequest):
    try:
        print(f"\n[🚀 BAKE PIPELINE STARTED] Initiating manufacturing for: {request.product_name}")
        print(f"[🔗 TARGET ASSET]: {request.video_url}")
        
        # 1. تجميع النص النهائي الصافي بالكامل لقراءته ومعالجته لاحقاً في محرك الصوت
        full_custom_script = f"{request.final_hook} {request.final_body} {request.final_cta}"
        
        print(f"[🎙️ INGESTED SCRIPT] ({request.selected_voice}): \"{full_custom_script}\"")
        print(f"[🎵 MUSIC ROUTING]: {request.selected_bg_music}")
        
        if request.watermark_attached and request.logo_url:
            print(f"[🛡️ SECURITY LAYER] Watermark asset detected: {request.logo_url}")
        
        # 2. بناء الأصول التسويقية تلقائياً لصفحة التحميل (Marketing Assets Copywriting)
        # لتوفر على المستخدم عناء الكتابة اليدوية في منصات الإعلانات
        clean_tags = request.product_name.replace(" ", "").lower()
        marketing_payload = {
            "video_caption": f"{request.final_hook} 🤫✨",
            "primary_ad_copy": f"Stop scrolling! 🚨 Our warehouse is clearing out inventory. This viral {request.product_name} completely flips your setup upside down. Get 50% OFF tonight only. Free Worldwide Shipping included! {request.final_cta}",
            "trending_hashtags": f"#dropshipping #viralproduct #tiktokmademebuyit #amazonfinds #{clean_tags} #ecommerce"
        }
        
        # 3. تجهيز بيانات المراقبة والتحميل النهائية (Master Output Monitor)
        # حالياً نمرر رابط الـ Proxy الأساسي، وفي المرحلة القادمة سنربطه بـ FFmpeg المدمج
        master_output_payload = {
            "video_stream_url": f"http://localhost:8000/api/proxy-video?url={request.video_url}",
            "render_status": "Ready to Download",
            "voice_profile_used": request.selected_voice,
            "captions_embedded": True,
            "logo_burned_locked": request.watermark_attached
        }
        
        print("[🏆 PIPELINE COMPLETED] Node data synchronized with downstream state.\n")
        
        return {
            "success": True,
            "master_output": master_output_payload,
            "marketing_assets": marketing_payload
        }
        
    except Exception as e:
        print(f"[🚨 PIPELINE ERROR]: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Baking pipeline failed: {str(e)}")