"""Advanced product insight payloads for the results dashboard."""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any


def _money(value: float) -> str:
    return f"${value:,.0f}"


def build_financials(keyword: str) -> dict[str, Any]:
    units_sold = random.randint(420, 4800)
    selling_price = round(random.uniform(22.0, 64.0), 2)
    supplier_cost_per_unit = round(selling_price * random.uniform(0.18, 0.38), 2)

    revenue = round(units_sold * selling_price, 2)
    cogs = round(units_sold * supplier_cost_per_unit, 2)
    estimated_ad_spend = round(revenue * 0.30, 2)
    net_profit = round(revenue - cogs - estimated_ad_spend, 2)
    net_profit_margin_pct = round((net_profit / revenue) * 100, 1) if revenue else 0.0

    trend_label = "scaling" if net_profit_margin_pct >= 18 else "tight"

    return {
        "units_sold": units_sold,
        "selling_price": selling_price,
        "supplier_cost_per_unit": supplier_cost_per_unit,
        "revenue": revenue,
        "revenue_display": _money(revenue),
        "cogs": cogs,
        "cogs_display": _money(cogs),
        "estimated_ad_spend": estimated_ad_spend,
        "estimated_ad_spend_display": _money(estimated_ad_spend),
        "ad_spend_rate": 0.30,
        "net_profit": net_profit,
        "net_profit_display": _money(net_profit),
        "net_profit_margin_pct": net_profit_margin_pct,
        "margin_trend": trend_label,
        "formula": "Net Profit = Revenue - COGS - Est. Ad Spend (30%)",
        "product_label": keyword,
    }


def build_sales_trend() -> dict[str, Any]:
    """Seven-day sales volume with a scaling or declining pattern."""
    scaling = random.random() > 0.35
    base = random.randint(28, 95)
    points: list[dict[str, Any]] = []
    today = datetime.now(timezone.utc).date()

    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        day_index = 6 - offset
        if scaling:
            volume = int(base * (0.72 + day_index * 0.11) + random.randint(-6, 14))
        else:
            volume = int(base * (1.18 - day_index * 0.09) + random.randint(-8, 10))
        volume = max(12, volume)
        points.append(
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "volume": volume,
            }
        )

    first, last = points[0]["volume"], points[-1]["volume"]
    delta_pct = round(((last - first) / first) * 100, 1) if first else 0.0
    direction = "scaling" if delta_pct >= 5 else "dying" if delta_pct <= -5 else "flat"

    return {
        "points": points,
        "direction": direction,
        "delta_pct": delta_pct,
    }


def build_active_competitors(keyword: str) -> list[dict[str, Any]]:
    slug = keyword.replace(" ", "").lower()
    hyphen = keyword.replace(" ", "-").lower()

    templates = [
        {
            "shop_name": f"{keyword.title()} Trends",
            "shop_url": f"https://{slug}trends.com",
            "selling_price": round(random.uniform(27.0, 49.0), 2),
            "ad_platform": "TikTok",
            "active_ad_url": f"https://www.tiktok.com/search?q={hyphen}%20ad",
            "spend": "High",
        },
        {
            "shop_name": f"Shop {keyword.title()}",
            "shop_url": f"https://shop{slug}.com",
            "selling_price": round(random.uniform(24.0, 42.0), 2),
            "ad_platform": "Meta",
            "active_ad_url": f"https://www.facebook.com/ads/library/?active_status=active&q={hyphen}",
            "spend": "Medium",
        },
        {
            "shop_name": f"The {keyword.title()} Co",
            "shop_url": f"https://the-{hyphen}-co.myshopify.com",
            "selling_price": round(random.uniform(32.0, 58.0), 2),
            "ad_platform": "TikTok",
            "active_ad_url": f"https://www.tiktok.com/search?q={slug}%20shop%20now",
            "spend": "Low",
        },
    ]

    competitors: list[dict[str, Any]] = []
    for item in templates:
        competitors.append(
            {
                "shop_name": item["shop_name"],
                "shop_url": item["shop_url"],
                "domain": item["shop_url"].replace("https://", "").split("/")[0],
                "selling_price": item["selling_price"],
                "price": f"${item['selling_price']:.2f}",
                "ad_platform": item["ad_platform"],
                "active_ad_url": item["active_ad_url"],
                "spend": item["spend"],
            }
        )
    return competitors
