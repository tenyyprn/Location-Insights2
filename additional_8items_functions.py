# 8項目対応のために不足している関数を追加
# main_original.pyの末尾に追加する必要な関数群

# =============================================================================
# 🆕 8項目対応: 買い物・飲食施設データ取得関数
# =============================================================================

async def get_shopping_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """買い物施設データを取得（飲食店除外版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    logger.info(f"🛒 買い物施設データ取得開始: 座標({coordinates['lat']:.4f}, {coordinates['lng']:.4f})")
    
    # 買い物専用施設タイプ（飲食店除外）
    facility_searches = [
        ("supermarket", 1000),        # スーパーマーケット
        ("convenience_store", 800),   # コンビニ
        ("department_store", 1500),   # デパート
        ("shopping_mall", 2000),      # ショッピングモール
        ("store", 1000),              # 一般店舗
        ("clothing_store", 1200),     # 服店
        ("electronics_store", 1500),  # 電器店
        ("hardware_store", 1200),     # ホームセンター
        ("pharmacy", 1000),           # 薬局
        ("grocery_or_supermarket", 1000) # 食材店
    ]
    
    all_facilities = []
    
    for facility_type, radius in facility_searches:
        logger.info(f"🔍 買い物施設検索中: {facility_type} (半径{radius}m)")
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        
        # 飲食店を除外（typesをチェック）
        filtered_places = []
        for place in places:
            place_types = place.get("types", [])
            # 飲食関連のタイプを除外
            if not any(food_type in place_types for food_type in [
                "restaurant", "food", "meal_takeaway", "meal_delivery", 
                "cafe", "bar", "bakery", "fast_food"
            ]):
                filtered_places.append(place)
        
        all_facilities.extend(filtered_places)
    
    # 重複除去と距離でソート
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    # 🔥 遠方排除: 2km以内の施設のみを対象
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 2000]
    logger.info(f"🔧 買い物施設距離フィルタリング: {len(unique_facilities)}件 → {len(filtered_facilities)}件 (2km以内)")
    
    # 施設データの正規化
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", []),
            "user_ratings_total": facility.get("user_ratings_total", 0),
            "price_level": facility.get("price_level", 0)
        })
    
    logger.info(f"🛒 買い物施設取得完了: 総計{len(simplified_facilities)}件 (飲食店除外)")
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

async def get_dining_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """飲食施設データを取得（買い物店除外版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    logger.info(f"🍽️ 飲食施設データ取得開始: 座標({coordinates['lat']:.4f}, {coordinates['lng']:.4f})")
    
    # 飲食専用施設タイプ
    facility_searches = [
        ("restaurant", 1000),      # レストラン
        ("cafe", 800),             # カフェ
        ("bar", 1000),             # バー
        ("meal_takeaway", 800),    # テイクアウト
        ("meal_delivery", 1000),   # デリバリー
        ("food", 1000),            # 食べ物関連
        ("bakery", 800),           # パン屋
        ("fast_food", 800)         # ファストフード
    ]
    
    all_facilities = []
    
    for facility_type, radius in facility_searches:
        logger.info(f"🔍 飲食施設検索中: {facility_type} (半径{radius}m)")
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        
        # 飲食関連のみを抽出（確実に飲食店のみ）
        filtered_places = []
        for place in places:
            place_types = place.get("types", [])
            # 飲食関連のタイプを含むもののみ
            if any(food_type in place_types for food_type in [
                "restaurant", "food", "meal_takeaway", "meal_delivery", 
                "cafe", "bar", "bakery", "fast_food"
            ]):
                filtered_places.append(place)
        
        all_facilities.extend(filtered_places)
    
    # 重複除去と距離でソート
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    # 🔥 遠方排除: 1.5km以内の施設のみを対象（飲食は近場を重視）
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 1500]
    logger.info(f"🔧 飲食施設距離フィルタリング: {len(unique_facilities)}件 → {len(filtered_facilities)}件 (1.5km以内)")
    
    # 施設データの正規化
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", []),
            "user_ratings_total": facility.get("user_ratings_total", 0),
            "price_level": facility.get("price_level", 0)
        })
    
    logger.info(f"🍽️ 飲食施設取得完了: 総計{len(simplified_facilities)}件 (買い物店除外)")
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

# =============================================================================
# 🆕 8項目対応: 環境・文化・その他データ取得関数
# =============================================================================

async def get_environment_data_with_temples(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """環境データを取得（公園、神社・寺院含む）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    logger.info(f"🌳 環境施設データ取得開始: 座標({coordinates['lat']:.4f}, {coordinates['lng']:.4f})")
    
    # 環境・自然施設タイプ
    facility_searches = [
        ("park", 1000),           # 公園
        ("cemetery", 1500),       # 墓地（静寂な環境）
        ("place_of_worship", 800), # 宗教施設（神社・寺院）
        ("tourist_attraction", 1200), # 観光地
        ("natural_feature", 1500),    # 自然地形
        ("zoo", 2000),               # 動物園
        ("amusement_park", 2000)     # 遊園地
    ]
    
    all_facilities = []
    
    for facility_type, radius in facility_searches:
        logger.info(f"🔍 環境施設検索中: {facility_type} (半径{radius}m)")
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        all_facilities.extend(places)
    
    # 重複除去と距離でソート
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    # 距離フィルタリング: 2km以内
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 2000]
    logger.info(f"🔧 環境施設距離フィルタリング: {len(unique_facilities)}件 → {len(filtered_facilities)}件 (2km以内)")
    
    # 施設データの正規化
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", [])
        })
    
    logger.info(f"🌳 環境施設取得完了: 総計{len(simplified_facilities)}件")
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

async def get_cultural_entertainment_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """文化・娯楽施設データを取得"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    logger.info(f"🎭 文化・娯楽施設データ取得開始: 座標({coordinates['lat']:.4f}, {coordinates['lng']:.4f})")
    
    # 文化・娯楽施設タイプ
    facility_searches = [
        ("library", 1500),           # 図書館
        ("museum", 2000),            # 博物館
        ("movie_theater", 1500),     # 映画館
        ("gym", 1000),               # ジム
        ("spa", 1500),               # スパ
        ("bowling_alley", 2000),     # ボウリング場
        ("casino", 2000),            # カジノ
        ("night_club", 1500),        # ナイトクラブ
        ("art_gallery", 2000),       # アートギャラリー
        ("stadium", 3000),           # スタジアム
        ("aquarium", 2500)           # 水族館
    ]
    
    all_facilities = []
    
    for facility_type, radius in facility_searches:
        logger.info(f"🔍 文化施設検索中: {facility_type} (半径{radius}m)")
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        all_facilities.extend(places)
    
    # 重複除去と距離でソート
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    # 距離フィルタリング: 3km以内（文化施設は遠くても価値あり）
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 3000]
    logger.info(f"🔧 文化施設距離フィルタリング: {len(unique_facilities)}件 → {len(filtered_facilities)}件 (3km以内)")
    
    # 施設データの正規化
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", [])
        })
    
    logger.info(f"🎭 文化・娯楽施設取得完了: 総計{len(simplified_facilities)}件")
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

# =============================================================================
# 🆕 8項目対応: 災害・犯罪データ取得関数（模擬データ）
# =============================================================================

async def get_disaster_risk_data(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """災害リスクデータを取得（模擬データ）"""
    # 座標に基づいた模擬的な災害リスク評価
    lat, lng = coordinates["lat"], coordinates["lng"]
    
    # 地域特性に基づく模擬リスク計算
    # 東京都心部（低リスク）、沿岸部（高リスク）、山間部（中リスク）
    if 35.6 <= lat <= 35.8 and 139.6 <= lng <= 139.8:  # 東京都心部
        flood_risk = 0.2
        earthquake_risk = 0.3
    elif lng >= 139.8:  # 東部（沿岸部）
        flood_risk = 0.6
        earthquake_risk = 0.4
    elif lat <= 35.6:  # 南部
        flood_risk = 0.4
        earthquake_risk = 0.3
    else:  # その他
        flood_risk = 0.3
        earthquake_risk = 0.4
    
    return {
        "flood_risk": flood_risk,
        "earthquake_risk": earthquake_risk,
        "overall_risk": (flood_risk + earthquake_risk) / 2,
        "data_source": "simulated_disaster_risk"
    }

async def get_crime_safety_data(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """犯罪・安全データを取得（模擬データ）"""
    # 座標に基づいた模擬的な犯罪率評価
    lat, lng = coordinates["lat"], coordinates["lng"]
    
    # 地域特性に基づく模擬安全スコア計算
    if 35.65 <= lat <= 35.75 and 139.65 <= lng <= 139.8:  # 都心部（比較的安全）
        safety_score = 85
        crime_incidents = 15
    elif lat >= 35.75:  # 北部（中安全）
        safety_score = 75
        crime_incidents = 25
    elif lng <= 139.65:  # 西部（高安全）
        safety_score = 90
        crime_incidents = 10
    else:  # その他
        safety_score = 70
        crime_incidents = 30
    
    return {
        "safety_score": safety_score,
        "crime_incidents_per_1000": crime_incidents,
        "safety_rating": "high" if safety_score >= 80 else "medium" if safety_score >= 60 else "low",
        "data_source": "simulated_crime_data"
    }

# =============================================================================
# 🆕 8項目対応: 改善されたスコア計算関数
# =============================================================================

def calculate_improved_education_score(education_data: Dict) -> float:
    """改善された教育スコア計算"""
    if not education_data:
        return 50.0
    
    total = education_data.get("total", 0)
    facilities = education_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大50点）
    base_score = min(50, total * 5)
    
    # 距離ボーナス（最大30点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 2000) for f in facilities])
        if nearest_distance <= 300:      # 300m以内
            distance_bonus = 30
        elif nearest_distance <= 600:    # 600m以内
            distance_bonus = 20
        elif nearest_distance <= 1000:   # 1km以内
            distance_bonus = 10
    
    # 品質ボーナス（最大20点）
    quality_bonus = 0
    if facilities:
        avg_rating = sum([f.get("rating", 0) for f in facilities]) / len(facilities)
        quality_bonus = min(20, avg_rating * 4)
    
    final_score = base_score + distance_bonus + quality_bonus
    return min(100, final_score)

def calculate_improved_medical_score(medical_data: Dict) -> float:
    """改善された医療スコア計算"""
    if not medical_data:
        return 50.0
    
    total = medical_data.get("total", 0)
    facilities = medical_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大60点）
    base_score = min(60, total * 6)
    
    # 距離ボーナス（最大25点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 3000) for f in facilities])
        if nearest_distance <= 500:      # 500m以内
            distance_bonus = 25
        elif nearest_distance <= 1000:   # 1km以内
            distance_bonus = 15
        elif nearest_distance <= 1500:   # 1.5km以内
            distance_bonus = 10
    
    # 品質ボーナス（最大15点）
    quality_bonus = 0
    if facilities:
        avg_rating = sum([f.get("rating", 0) for f in facilities]) / len(facilities)
        quality_bonus = min(15, avg_rating * 3)
    
    final_score = base_score + distance_bonus + quality_bonus
    return min(100, final_score)

def calculate_improved_transport_score(transport_data: Dict) -> float:
    """改善された交通スコア計算"""
    if not transport_data:
        return 40.0
    
    total = transport_data.get("total", 0)
    facilities = transport_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大70点）
    base_score = min(70, total * 10)
    
    # 距離ボーナス（最大30点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 3000) for f in facilities])
        if nearest_distance <= 400:      # 400m以内
            distance_bonus = 30
        elif nearest_distance <= 800:    # 800m以内
            distance_bonus = 20
        elif nearest_distance <= 1200:   # 1.2km以内
            distance_bonus = 10
    
    final_score = base_score + distance_bonus
    return min(100, final_score)

def calculate_improved_shopping_score(shopping_data: Dict) -> float:
    """改善された買い物スコア計算（8項目対応版）"""
    if not shopping_data:
        return 50.0
    
    total = shopping_data.get("total", 0)
    facilities = shopping_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大50点）
    base_score = min(50, total * 3)
    
    # 距離ボーナス（最大30点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 2000) for f in facilities])
        if nearest_distance <= 300:      # 300m以内
            distance_bonus = 30
        elif nearest_distance <= 600:    # 600m以内
            distance_bonus = 20
        elif nearest_distance <= 1000:   # 1km以内
            distance_bonus = 10
    
    # 品質・多様性ボーナス（最大20点）
    variety_bonus = 0
    if facilities:
        # 施設タイプの多様性を評価
        unique_types = set()
        for facility in facilities:
            types = facility.get("types", [])
            unique_types.update(types)
        variety_bonus = min(20, len(unique_types) * 2)
    
    final_score = base_score + distance_bonus + variety_bonus
    return min(100, final_score)

def calculate_improved_dining_score(dining_data: Dict) -> float:
    """改善された飲食スコア計算（8項目対応版）"""
    if not dining_data:
        return 45.0
    
    total = dining_data.get("total", 0)
    facilities = dining_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大55点）
    base_score = min(55, total * 2.5)
    
    # 距離ボーナス（最大25点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 2000) for f in facilities])
        if nearest_distance <= 200:      # 200m以内
            distance_bonus = 25
        elif nearest_distance <= 500:    # 500m以内
            distance_bonus = 15
        elif nearest_distance <= 800:    # 800m以内
            distance_bonus = 10
    
    # 品質ボーナス（最大20点）
    quality_bonus = 0
    if facilities:
        avg_rating = sum([f.get("rating", 0) for f in facilities]) / len(facilities)
        quality_bonus = min(20, avg_rating * 4)
    
    final_score = base_score + distance_bonus + quality_bonus
    return min(100, final_score)

def calculate_improved_commercial_score(commercial_data: Dict) -> float:
    """改善された商業スコア計算（7項目版との互換性維持）"""
    # 8項目版では buying + dining を統合した場合のフォールバック
    return 75.0  # デフォルト値

def calculate_environment_score_with_temples(environment_data: Dict) -> float:
    """環境スコア計算（神社・寺院含む）"""
    if not environment_data:
        return 60.0
    
    total = environment_data.get("total", 0)
    facilities = environment_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大50点）
    base_score = min(50, total * 5)
    
    # 距離ボーナス（最大30点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 3000) for f in facilities])
        if nearest_distance <= 300:      # 300m以内
            distance_bonus = 30
        elif nearest_distance <= 800:    # 800m以内
            distance_bonus = 20
        elif nearest_distance <= 1500:   # 1.5km以内
            distance_bonus = 10
    
    # 種類ボーナス（最大20点）
    type_bonus = 0
    if facilities:
        facility_types = set()
        for facility in facilities:
            types = facility.get("types", [])
            facility_types.update(types)
        
        # 特定タイプへのボーナス
        if "park" in " ".join(facility_types):
            type_bonus += 8
        if "place_of_worship" in " ".join(facility_types):
            type_bonus += 6
        if "cemetery" in " ".join(facility_types):
            type_bonus += 4
        if "tourist_attraction" in " ".join(facility_types):
            type_bonus += 2
    
    final_score = base_score + distance_bonus + type_bonus
    return min(100, final_score)

def calculate_cultural_entertainment_score(cultural_data: Dict) -> float:
    """文化・娯楽スコア計算"""
    if not cultural_data:
        return 50.0
    
    total = cultural_data.get("total", 0)
    facilities = cultural_data.get("facilities", [])
    
    # 基本スコア（施設数ベース、最大40点）
    base_score = min(40, total * 4)
    
    # 距離ボーナス（最大35点）
    distance_bonus = 0
    if facilities:
        nearest_distance = min([f.get("distance", 5000) for f in facilities])
        if nearest_distance <= 800:      # 800m以内
            distance_bonus = 35
        elif nearest_distance <= 1500:   # 1.5km以内
            distance_bonus = 25
        elif nearest_distance <= 2500:   # 2.5km以内
            distance_bonus = 15
        elif nearest_distance <= 4000:   # 4km以内
            distance_bonus = 10
    
    # 種類ボーナス（最大25点）
    type_bonus = 0
    if facilities:
        facility_types = set()
        for facility in facilities:
            types = facility.get("types", [])
            facility_types.update(types)
        
        # 特定タイプへのボーナス
        bonus_types = ["library", "museum", "movie_theater", "gym", "art_gallery"]
        for bonus_type in bonus_types:
            if bonus_type in " ".join(facility_types):
                type_bonus += 5
    
    final_score = base_score + distance_bonus + type_bonus
    return min(100, final_score)

logger.info("🆕 8項目対応: 追加関数定義完了")
