"""
距離計算ユーティリティ
2点間の距離計算機能
"""
import math
from typing import Dict

def calculate_distance(coord1: Dict[str, float], coord2: Dict[str, float]) -> float:
    """2点間の距離を計算（メートル）"""
    R = 6371000  # 地球の半径（メートル）
    
    lat1_rad = math.radians(coord1["lat"])
    lat2_rad = math.radians(coord2["lat"])
    delta_lat = math.radians(coord2["lat"] - coord1["lat"])
    delta_lng = math.radians(coord2["lng"] - coord1["lng"])
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def calculate_walking_time(distance_meters: float) -> int:
    """距離から徒歩時間を計算（分）"""
    # 平均歩行速度 80m/分
    walking_speed = 80  # m/min
    return max(1, int(distance_meters / walking_speed))

def get_distance_category(distance_meters: float) -> str:
    """距離をカテゴリ分類"""
    if distance_meters <= 300:
        return "very_close"  # 徒歩5分以内
    elif distance_meters <= 800:
        return "close"       # 徒歩10分以内
    elif distance_meters <= 1500:
        return "moderate"    # 徒歩20分以内
    elif distance_meters <= 3000:
        return "far"         # 徒歩40分以内
    else:
        return "very_far"    # 徒歩40分超
