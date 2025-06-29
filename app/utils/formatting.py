"""
フォーマット関連ユーティリティ
データの表示形式変換機能
"""
from typing import List, Dict, Any

def format_price_japanese(price: int) -> str:
    """価格を日本式フォーマットで表示"""
    if price >= 100000000:
        return f"{price / 100000000:.1f}億円"
    elif price >= 10000:
        return f"{price / 10000:.0f}万円"
    else:
        return f"{price:,}円"

def format_distance(distance_meters: float) -> str:
    """距離を適切な単位でフォーマット"""
    if distance_meters < 1000:
        return f"{int(distance_meters)}m"
    else:
        return f"{distance_meters/1000:.1f}km"

def remove_duplicate_places(places: List[Dict]) -> List[Dict]:
    """重複する場所を除去"""
    seen = set()
    unique_places = []
    
    for place in places:
        # place_idがあればそれを使用、なければ名前で重複チェック
        identifier = place.get("place_id") or place.get("name", "")
        if identifier and identifier not in seen:
            seen.add(identifier)
            unique_places.append(place)
    
    return unique_places

def get_grade(total_score: float) -> str:
    """スコアからグレードを算出"""
    if total_score >= 90:
        return "S"
    elif total_score >= 80:
        return "A"
    elif total_score >= 70:
        return "B"
    elif total_score >= 60:
        return "C"
    else:
        return "D"

def truncate_text(text: str, max_length: int = 100) -> str:
    """テキストを指定の長さで切り詰め"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."

def safe_get(dictionary: Dict, key: str, default: Any = None) -> Any:
    """辞書から安全に値を取得"""
    try:
        return dictionary.get(key, default)
    except (AttributeError, TypeError):
        return default
