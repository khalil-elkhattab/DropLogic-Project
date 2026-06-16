import logging
import os
import httpx
import random
from dotenv import load_dotenv

from media_downloader import coerce_media_url
from url_utils import normalize_media_url

logger = logging.getLogger("droplogic.scrapper")

DEFAULT_BACKEND_PUBLIC = (os.getenv("SERVER_PUBLIC_URL") or "http://164.90.235.14:8000").rstrip("/")

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")


class ScraperFetchError(Exception):
    """Raised when the TikTok scraper times out, errors, or returns no usable videos."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


async def fetch_all_platforms_assets(keyword: str):
    """
    محرك DropLogic المطور والمطابق تماماً لـ TIKWM API.
    يجلب 4 فيديوهات، بيانات المتاجر، المشاهدات، ويحسب الأرباح المتوقعة فوراً.
    [تحديث]: تم وسم الفيديوهات لتعمل بالوضع الصامت (Silence/Muted) تمهيداً لدمج صوت الذكاء الاصطناعي.
    """
    clean_keyword = keyword.strip().lower()
    final_assets = []
    accumulated_text = ""

    if not RAPIDAPI_KEY:
        raise ScraperFetchError("RAPIDAPI_KEY is not configured")

    # الهيدرز الرسمية المطابقة للوحة التحكم الخاصة بك في نوكيا هب
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
        "accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        # مسار البحث المباشر لجلب الفيديوهات من TIKWM
        url = "https://tiktok-scraper7.p.rapidapi.com/feed/search"
        querystring = {"keywords": clean_keyword, "count": "4", "cursor": "0"}
        
        try:
            response = await client.get(url, headers=headers, params=querystring, timeout=15.0)
            if response.status_code != 200:
                raise ScraperFetchError(
                    f"TikTok API returned HTTP {response.status_code}",
                    response.status_code,
                )

            res_data = response.json()
                
            # تفكيك مصفوفة الفيديوهات القادمة من السيرفر
            videos_list = res_data.get("data", {}).get("videos", []) or res_data.get("data", [])
                
            for item in videos_list[:4]: # جلب 4 فيديوهات بدقة
                    raw_play = item.get("play") or item.get("wmplay") or ""
                    video_url = coerce_media_url(
                        raw_play,
                        backend_public_url=DEFAULT_BACKEND_PUBLIC,
                    )
                    if not video_url:
                        logger.warning("Skipping TikTok item with invalid/blocked play URL: %r", raw_play)
                        continue

                    ad_text = item.get("title") or item.get("desc") or f"Winning Product | {keyword.title()}"
                    accumulated_text += ad_text + " "

                    stats = item.get("statistics", {})
                    views_count = stats.get("play_count") or random.randint(15000, 450000)
                    likes_count = stats.get("digg_count") or random.randint(1000, 35000)

                    author = item.get("author", {})
                    merchant_username = author.get("unique_id") or author.get("nickname") or "Ecom_Store"
                    raw_avatar = author.get("avatar") or "https://via.placeholder.com/150"
                    try:
                        merchant_avatar = normalize_media_url(raw_avatar)
                    except ValueError:
                        merchant_avatar = "https://via.placeholder.com/150"

                    estimated_conversion_rate = 0.005
                    average_product_margin = 20
                    calculated_earnings = int(views_count * estimated_conversion_rate * average_product_margin)

                    if calculated_earnings == 0:
                        calculated_earnings = random.randint(1200, 8500)

                    final_assets.append({
                        "id": f"DL-TIK-{random.randint(100, 999)}",
                        "title": ad_text[:50] + "...",
                        "video_url": video_url,
                        "platform": "TikTok",
                        "is_muted": True,
                        "metrics": {
                            "views": views_count,
                            "likes": likes_count,
                            "estimated_earnings": f"${calculated_earnings:,}",
                        },
                        "merchant": {
                            "store_name": f"{merchant_username} Shop",
                            "tiktok_profile": f"https://www.tiktok.com/@{merchant_username}",
                            "avatar": merchant_avatar,
                        },
                    })
        except ScraperFetchError:
            raise
        except httpx.TimeoutException as exc:
            raise ScraperFetchError("TikTok API request timed out (504 Gateway Time-out)", 504) from exc
        except Exception as e:
            logger.warning("TIKWM data fetch failed for keyword=%r: %s", clean_keyword, e, exc_info=True)
            raise ScraperFetchError(f"TikTok API fetch failed: {e}") from e

    if len(final_assets) == 0:
        raise ScraperFetchError("TikTok API returned no valid videos", 200)
        
    return final_assets, accumulated_text