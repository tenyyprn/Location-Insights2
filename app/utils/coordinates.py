"""
座標計算ユーティリティ
緯度経度の計算と変換機能
"""
import math
from typing import Tuple, Dict

def lat_lng_to_tile_xyz(lat: float, lng: float, zoom: int) -> Tuple[int, int, int]:
    """緯度経度からXYZタイル座標に変換"""
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x = int((lng + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (x, y, zoom)

def get_tile_coordinates_around_point(
    lat: float, 
    lng: float, 
    zoom: int = 13, 
    radius: int = 1
) -> list[Tuple[int, int, int]]:
    """指定座標周辺のタイル座標を取得"""
    center_x, center_y, z = lat_lng_to_tile_xyz(lat, lng, zoom)
    tiles = []
    
    for dx in range(-radius, radius + 1):
        for dy in range(-radius, radius + 1):
            x = center_x + dx
            y = center_y + dy
            if x >= 0 and y >= 0:  # 負の座標を避ける
                tiles.append((x, y, z))
    
    return tiles

def is_within_japan(lat: float, lng: float) -> bool:
    """座標が日本国内かどうかを判定"""
    return 24.0 <= lat <= 46.0 and 123.0 <= lng <= 146.0

def validate_coordinates(coordinates: Dict[str, float]) -> bool:
    """座標の妥当性をチェック"""
    try:
        lat = coordinates.get('lat')
        lng = coordinates.get('lng')
        
        if lat is None or lng is None:
            return False
            
        # 緯度経度の範囲チェック
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return False
            
        return True
    except (TypeError, ValueError):
        return False
