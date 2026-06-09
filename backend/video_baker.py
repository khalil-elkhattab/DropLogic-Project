import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from gtts import gTTS

# 1️⃣ ضبط الـ Router البرمجي ليتطابق تماماً مع نظام الـ Video Studio الأصلي في منصتك
router = APIRouter(prefix="/api/video-studio", tags=["Video Studio"])

# 2️⃣ الهيكل القياسي الشامل والمطابق تماماً لمتطلبات واجهة الـ Swagger لديك
class VideoBakeRequest(BaseModel):
    product_name: str
    video_url: str
    final_hook: str
    final_body: str
    final_cta: str
    selected_voice: str
    selected_bg_music: str
    watermark_attached: bool
    logo_url: Optional[str] = None
    video_duration: Optional[float] = 15.0
    video_scale: Optional[float] = 1.0
    camera_effect: Optional[str] = "zoomIn"
    bg_camera_effect: Optional[str] = "zoomInSlow"
    audio_volume: Optional[float] = 1.0

@router.post("/bake")
async def bake_final_video(payload: VideoBakeRequest):
    try:
        print(f"[🚀 CLOUD BAKE START] Offloading rendering pipeline for: {payload.product_name}")
        
        # استدعاء المتغيرات البيئية للمفاتيح السحابية الجديدة وعنوان السيرفر العام
        json2video_key = os.getenv("JSON2VIDEO_API_KEY", "ضع_مفتاح_json2video_هنا")
        renderform_key = os.getenv("RENDERFORM_API_KEY", "ضع_مفتاح_renderform_هنا")
        server_public_url = os.getenv("SERVER_PUBLIC_URL", "http://164.90.235.14:8000")
        
        # تنظيف مسار الخادم العام الممرر من أي شوائب إملائية في النهاية
        server_public_url = server_public_url.rstrip('/')

        # 3️⃣ هندسة وتوليد الملف الصوتي للمنتج محلياً (gTTS)
        print("[🎙️ AI SYNTHESIS] Generating voice over via internal engine...")
        os.makedirs("static/audio", exist_ok=True)
        unique_id = os.urandom(4).hex()
        voice_filename = f"voice_{unique_id}.mp3"
        voice_audio_path = f"static/audio/{voice_filename}"
        
        # دمج عناصر السيناريو الثلاثة لبناء الهيكل النصي الموحد للتعليق الصوتي
        full_ad_text = f"{payload.final_hook}. {payload.final_body}. {payload.final_cta}"
        tts = gTTS(text=full_ad_text, lang='en', tld='com')
        tts.save(voice_audio_path)

        # استخراج الرابط العام لملف الصوت للسماح بالتهام الأصول سحابياً
        public_audio_url = f"{server_public_url}/static/audio/{voice_filename}"
        print(f"[🎵 AUDIO MIXER] Configured for ingestion: {public_audio_url}")

        # 4️⃣ نظام الحماية المزدوج المخصص لإعلانات تيك توك والريلز الطولية (1080x1920)
        
        # 🟢 [المسار الأول]: محاولة الطبخ عبر المحرك الأساسي Json2Video
        try:
            print("[🚀 ENGINE 1] Attempting to bake video via Json2Video API...")
            json2video_url = "https://api.json2video.com/v2/movie"
            
            j2v_payload = {
                "comment": f"DropLogic Ad for {payload.product_name}",
                "width": 1080,   # الأبعاد الذهبية لإعلانات التيك توك والـ Reels
                "height": 1920,
                "fps": 30,
                "elements": [
                    {
                        "type": "video",
                        "src": payload.video_url,
                        "duration": payload.video_duration if payload.video_duration else -1,
                        "volume": 0  # كتم صوت الفيديو الأصلي المستورد لمنع تداخل الأصوات
                    },
                    {
                        "type": "audio",
                        "src": public_audio_url,
                        "mix": True
                    }
                ]
            }
            
            j2v_headers = {
                "X-API-Key": json2video_key,
                "Content-Type": "application/json"
            }
            
            response = requests.post(json2video_url, json=j2v_payload, headers=j2v_headers, timeout=15)
            
            if response.status_code in [200, 201]:
                res_data = response.json()
                project_id = res_data.get("project")
                print(f"[🟢 SUCCESS 1] Video accepted by Json2Video. Project ID: {project_id}")
                
                return {
                    "success": True,
                    "message": "Baking pipeline offloaded to cloud successfully. Concurrency safe.",
                    "render_id": f"json2video_{project_id}",
                    "check_status_url": f"{server_public_url}/api/video-studio/render-status/json2video_{project_id}",
                    "marketing_assets": {
                        "video_caption": f"{payload.final_hook} 🔥 {payload.final_body} ⏳ {payload.final_cta}"
                    }
                }
            else:
                print(f"[⚠️ WARNING 1] Json2Video rejected payload with code {response.status_code}. Shifting to backup...")
                raise Exception("Primary gateway exhausted")

        # 🔄 [المسار الثاني/الاحتياطي]: التحويل لـ RenderForm تلقائياً في حال حدوث أي خطأ أو نفاد رصيد المحرك الأول
        except Exception as primary_error:
            print("[🔄 FAILOVER ACTIVE] Shifting pipeline gears to RenderForm API...")
            renderform_url = "https://get.renderform.io/api/v1/render"
            
            rf_payload = {
                "canvas": {
                    "width": 1080,
                    "height": 1920
                },
                "data": {
                    "background_video.src": payload.video_url,
                    "voiceover_audio.src": public_audio_url
                }
            }
            
            rf_headers = {
                "X-API-KEY": renderform_key,
                "Content-Type": "application/json"
            }
            
            response = requests.post(renderform_url, json=rf_payload, headers=rf_headers, timeout=15)
            
            if response.status_code in [200, 201]:
                res_data = response.json()
                render_id = res_data.get("request_id") or res_data.get("id")
                print(f"[🟢 SUCCESS 2] Video accepted by Backup RenderForm. Render ID: {render_id}")
                
                return {
                    "success": True,
                    "message": "Baking pipeline offloaded to cloud successfully. Concurrency safe.",
                    "render_id": f"renderform_{render_id}",
                    "check_status_url": f"{server_public_url}/api/video-studio/render-status/renderform_{render_id}",
                    "marketing_assets": {
                        "video_caption": f"{payload.final_hook} 🔥 {payload.final_body} ⏳ {payload.final_cta}"
                    }
                }
            else:
                print("[-] Both cloud automation gateways are exhausted.")
                raise HTTPException(
                    status_code=500, 
                    detail="All cloud video automation gateways are temporarily exhausted. Please check API balances."
                )

    except Exception as e:
        print("[-] Enterprise Cloud Pipeline Failed:", str(e))
        raise HTTPException(status_code=500, detail=f"Baking pipeline failed: {str(e)}")


@router.get("/render-status/{combined_id}")
async def get_render_status(combined_id: str):
    """
    مستقبل الفحص الذكي: يتعرف تلقائياً على المزود من البادئة ويجلب حالة الرندر وموقع الـ mp4 النهائي
    """
    try:
        if combined_id.startswith("json2video_"):
            render_id = combined_id.replace("json2video_", "")
            json2video_key = os.getenv("JSON2VIDEO_API_KEY", "ضع_مفتاح_json2video_هنا")
            
            url = f"https://api.json2video.com/v2/movie?project={render_id}"
            headers = {"X-API-Key": json2video_key}
            
            response = requests.get(url, headers=headers)
            data = response.json()
            
            status = data.get("status", "processing")
            video_url = data.get("url") if status == "completed" else None
            
            return {
                "render_id": combined_id,
                "status": "completed" if status == "completed" else "rendering",
                "final_video_url": video_url
            }
            
        elif combined_id.startswith("renderform_"):
            render_id = combined_id.replace("renderform_", "")
            renderform_key = os.getenv("RENDERFORM_API_KEY", "ضع_مفتاح_renderform_هنا")
            
            url = f"https://get.renderform.io/api/v1/render-status?request_id={render_id}"
            headers = {"X-API-KEY": renderform_key}
            
            response = requests.get(url, headers=headers)
            data = response.json()
            
            status = data.get("status", "processing")
            video_url = data.get("href")
            
            return {
                "render_id": combined_id,
                "status": "completed" if status == "finished" else "rendering",
                "final_video_url": video_url
            }
        else:
            raise HTTPException(status_code=400, detail="Malformed or unrecognized rendering provider ID.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status fetching failed: {str(e)}")