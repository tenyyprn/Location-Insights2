# =============================================================================
# 🆕 8項目対応: 買い物・飲食施設データ取得関数および改善されたスコア計算関数
# =============================================================================

async def get_shopping_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """🛒 買い物施設データを取得（8項目対応版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    logger.info(f"🛒 買い物施設データ取得開始: 座標({coordinates['lat']:.4f}, {coordinates['lng']:.4f})")
    
    # 買い物施設タイプ（飲食店を除外）
    facility_searches = [
        ("supermarket", 1000),          # スーパーマーケット
        ("convenience_store", 500),     # コンビニ
        ("department_store", 1500),     # デパート
        ("shopping_mall", 2000),        # ショッピングモール
        ("pharmacy", 800),              # 薬局（買い物として含む）
        ("clothing_store", 1200),       # 衣料品店
        ("electronics_store", 1500),    # 電気店
        ("book_store", 1200),           # 書店
        ("furniture_store", 2000),      # 家具店
        ("hardware_store", 1500)        # ホームセンター
    ]
    
    all_facilities = []
    
    for facility_type, radius in facility_searches:
        logger.info(f"🔍 検索中: {facility_type} (半径{radius}m)")
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        
        # 飲食店タイプを除外
        filtered_places = []
        for place in places:
            place_types = place.get("types", [])
            # 飲食店関連のタイプを除外
            if not any(food_type in place_types for food_type in [
                "restaurant", "cafe", "bar", "meal_takeaway", "meal_delivery",
                "food", "bakery", "liquor_store"
            ]):
                filtered_places.append(place)
        
        all_facilities.extend(filtered_places)
    
    # 重複除去と距離でソート
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    # 遠方排除: 2km以内の施設のみを対象
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 2000]
    logger.info(f"🔧 距離フィルタリング: {len(unique_facilities)}件 → {len(filtered_facilities)}件 (2km以内)")
    
    # 施設データの正規化（上限なし）
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", []),
            "user_ratings_total": facility.get("user_ratings_total", 0)
        })
    
    logger.info(f"🛒 買い物施設取得完了: 総計{len(simplified_facilities)}件 (飲食店除外、2km以内)")
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

async def get_dining_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """🍽️ 飲食施設データを取得（8項目対応版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    logger.info(f"🍽️ 飲食施設データ取得開始: 座標({coordinates['lat']:.4f}, {coordinates['lng']:.4f})")
    
    # 飲食施設タイプ
    facility_searches = [
        ("restaurant", 1500),           # レストラン
        ("cafe", 1000),                # カフェ
        ("bar", 1200),                 # バー
        ("meal_takeaway", 800),        # テイクアウト
        ("meal_delivery", 1000),       # デリバリー
        ("bakery", 1000),              # パン屋
        ("food", 1500)                 # 一般的な飲食店
    ]
    
    all_facilities = []
    
    for facility_type, radius in facility_searches:
        logger.info(f"🔍 検索中: {facility_type} (半径{radius}m)")
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        all_facilities.extend(places)
    
    # 重複除去と距離でソート
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    # 遠方排除: 2km以内の施設のみを対象
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 2000]
    logger.info(f"🔧 距離フィルタリング: {len(unique_facilities)}件 → {len(filtered_facilities)}件 (2km以内)")
    
    # 施設データの正規化（上限なし）
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", []),
            "user_ratings_total": facility.get("user_ratings_total", 0)
        })
    
    logger.info(f"🍽️ 飲食施設取得完了: 総計{len(simplified_facilities)}件 (2km以内)")
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

# =============================================================================
# 🆕 8項目対応: 改善されたスコア計算関数
# =============================================================================

def calculate_improved_shopping_score(shopping_data: Dict) -> float:
    """改善された買い物スコア計算（8項目対応版）"""
    if not shopping_data or shopping_data.get("total", 0) == 0:
        return 20.0  # 基本点を20点に下げる
    
    total = shopping_data.get("total", 0)
    facilities = shopping_data.get("facilities", [])
    
    # 基本スコア（施設数、最大40点）
    base_score = min(40, total * 3)  # 1施設につき3点
    
    # 距離評価（最大30点）
    distance_score = 0
    for facility in facilities[:10]:  # 上位10件を評価
        distance = facility.get("distance", float('inf'))
        if distance <= 200:
            distance_score += 5  # 徒歩圏内
        elif distance <= 500:
            distance_score += 3  # 近距離
        elif distance <= 1000:
            distance_score += 2  # 中距離
        else:
            distance_score += 1  # 遠距離
    
    distance_score = min(30, distance_score)
    
    # 品質評価（最大30点）
    quality_score = 0
    rated_facilities = [f for f in facilities if f.get("rating", 0) > 0]
    if rated_facilities:
        avg_rating = sum(f.get("rating", 0) for f in rated_facilities) / len(rated_facilities)
        avg_reviews = sum(f.get("user_ratings_total", 0) for f in rated_facilities) / len(rated_facilities)
        
        quality_score = (avg_rating - 3.5) * 10 + min(avg_reviews / 20, 10)  # 評価とレビュー数
        quality_score = max(0, min(30, quality_score))
    
    final_score = base_score + distance_score + quality_score
    return round(final_score, 1)

def calculate_improved_dining_score(dining_data: Dict) -> float:
    """改善された飲食スコア計算（8項目対応版）"""
    if not dining_data or dining_data.get("total", 0) == 0:
        return 20.0  # 基本点を20点に下げる
    
    total = dining_data.get("total", 0)
    facilities = dining_data.get("facilities", [])
    
    # 基本スコア（施設数、最大40点）
    base_score = min(40, total * 2.5)  # 1施設につき2.5点
    
    # 距離評価（最大30点）
    distance_score = 0
    for facility in facilities[:10]:  # 上位10件を評価
        distance = facility.get("distance", float('inf'))
        if distance <= 300:
            distance_score += 5  # 徒歩圏内
        elif distance <= 800:
            distance_score += 3  # 近距離
        elif distance <= 1500:
            distance_score += 2  # 中距離
        else:
            distance_score += 1  # 遠距離
    
    distance_score = min(30, distance_score)
    
    # 品質評価（最大30点）
    quality_score = 0
    rated_facilities = [f for f in facilities if f.get("rating", 0) > 0]
    if rated_facilities:
        avg_rating = sum(f.get("rating", 0) for f in rated_facilities) / len(rated_facilities)
        avg_reviews = sum(f.get("user_ratings_total", 0) for f in rated_facilities) / len(rated_facilities)
        
        # 飲食店は評価が重要なので品質スコアの重みを上げる
        quality_score = (avg_rating - 3.0) * 12 + min(avg_reviews / 15, 18)
        quality_score = max(0, min(30, quality_score))
    
    final_score = base_score + distance_score + quality_score
    return round(final_score, 1)

def calculate_improved_education_score(education_data: Dict) -> float:
    """改善された教育スコア計算"""
    if not education_data or education_data.get("total", 0) == 0:
        return 25.0
    
    total = education_data.get("total", 0)
    facilities = education_data.get("facilities", [])
    
    base_score = min(50, total * 5)
    
    distance_score = 0
    for facility in facilities[:8]:
        distance = facility.get("distance", float('inf'))
        if distance <= 500:
            distance_score += 8
        elif distance <= 1000:
            distance_score += 5
        elif distance <= 1500:
            distance_score += 3
        else:
            distance_score += 1
    
    distance_score = min(25, distance_score)
    
    type_diversity_score = 0
    types_found = set()
    for facility in facilities:
        facility_types = facility.get("types", [])
        if "primary_school" in facility_types:
            types_found.add("primary")
        elif "secondary_school" in facility_types:
            types_found.add("secondary")
        elif "university" in facility_types:
            types_found.add("university")
        else:
            types_found.add("school")
    
    type_diversity_score = len(types_found) * 6.25  # 最大25点
    type_diversity_score = min(25, type_diversity_score)
    
    final_score = base_score + distance_score + type_diversity_score
    return round(final_score, 1)

def calculate_improved_medical_score(medical_data: Dict) -> float:
    """改善された医療スコア計算"""
    if not medical_data or medical_data.get("total", 0) == 0:
        return 25.0
    
    total = medical_data.get("total", 0)
    facilities = medical_data.get("facilities", [])
    
    base_score = min(45, total * 4)
    
    distance_score = 0
    for facility in facilities[:10]:
        distance = facility.get("distance", float('inf'))
        if distance <= 400:
            distance_score += 6
        elif distance <= 1000:
            distance_score += 4
        elif distance <= 2000:
            distance_score += 2
        else:
            distance_score += 1
    
    distance_score = min(30, distance_score)
    
    type_coverage_score = 0
    types_found = set()
    for facility in facilities:
        facility_types = facility.get("types", [])
        if "hospital" in facility_types:
            types_found.add("hospital")
        elif "pharmacy" in facility_types:
            types_found.add("pharmacy")
        elif "dentist" in facility_types:
            types_found.add("dentist")
        else:
            types_found.add("clinic")
    
    type_coverage_score = len(types_found) * 6.25  # 最大25点
    type_coverage_score = min(25, type_coverage_score)
    
    final_score = base_score + distance_score + type_coverage_score
    return round(final_score, 1)

def calculate_improved_transport_score(transport_data: Dict) -> float:
    """改善された交通スコア計算"""
    if not transport_data or transport_data.get("total", 0) == 0:
        return 25.0
    
    total = transport_data.get("total", 0)
    facilities = transport_data.get("facilities", [])
    
    base_score = min(40, total * 8)
    
    distance_score = 0
    for facility in facilities[:5]:
        distance = facility.get("distance", float('inf'))
        if distance <= 300:
            distance_score += 15
        elif distance <= 600:
            distance_score += 10
        elif distance <= 1200:
            distance_score += 6
        else:
            distance_score += 3
    
    distance_score = min(35, distance_score)
    
    access_quality_score = 0
    major_stations = [f for f in facilities if f.get("rating", 0) >= 4.0]
    access_quality_score = min(25, len(major_stations) * 8.33)
    
    final_score = base_score + distance_score + access_quality_score
    return round(final_score, 1)

def calculate_improved_commercial_score(commercial_data: Dict) -> float:
    """改善された商業スコア計算（従来の買い物・飲食統合版）"""
    if not commercial_data or commercial_data.get("total", 0) == 0:
        return 20.0
    
    total = commercial_data.get("total", 0)
    facilities = commercial_data.get("facilities", [])
    
    base_score = min(45, total * 2)
    
    distance_score = 0
    for facility in facilities[:15]:
        distance = facility.get("distance", float('inf'))
        if distance <= 300:
            distance_score += 4
        elif distance <= 800:
            distance_score += 3
        elif distance <= 1500:
            distance_score += 2
        else:
            distance_score += 1
    
    distance_score = min(30, distance_score)
    
    variety_score = 0
    types_found = set()
    for facility in facilities:
        facility_types = facility.get("types", [])
        for ftype in facility_types:
            if ftype in ["supermarket", "convenience_store", "restaurant", "cafe", "pharmacy", "shopping_mall"]:
                types_found.add(ftype)
    
    variety_score = min(25, len(types_found) * 4.17)
    
    final_score = base_score + distance_score + variety_score
    return round(final_score, 1)

# =============================================================================
# 🆕 その他の必要な関数（プレースホルダー版）
# =============================================================================

async def get_transport_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """交通機関データを取得（プレースホルダー版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    facility_searches = [
        ("transit_station", 1500),
        ("subway_station", 1200),
        ("bus_station", 800)
    ]
    
    all_facilities = []
    for facility_type, radius in facility_searches:
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        all_facilities.extend(places)
    
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    filtered_facilities = [f for f in unique_facilities if f.get('distance', 0) <= 2000]
    
    simplified_facilities = []
    for facility in filtered_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", [])
        })
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

async def get_environment_data_with_temples(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """環境データ取得（プレースホルダー版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    facility_searches = [
        ("park", 1000),
        ("temple", 1500),
        ("shrine", 1500)
    ]
    
    all_facilities = []
    for facility_type, radius in facility_searches:
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        all_facilities.extend(places)
    
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    simplified_facilities = []
    for facility in unique_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", [])
        })
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

async def get_cultural_entertainment_facilities(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """文化・娯楽施設データ取得（プレースホルダー版）"""
    if not GOOGLE_MAPS_API_KEY:
        return {"total": 0, "facilities": []}
    
    facility_searches = [
        ("library", 1500),
        ("museum", 2000),
        ("movie_theater", 2000),
        ("gym", 1500)
    ]
    
    all_facilities = []
    for facility_type, radius in facility_searches:
        places = await search_nearby_places(session, coordinates, facility_type, radius)
        all_facilities.extend(places)
    
    unique_facilities = remove_duplicate_places(all_facilities)
    unique_facilities.sort(key=lambda x: x.get('distance', float('inf')))
    
    simplified_facilities = []
    for facility in unique_facilities:
        simplified_facilities.append({
            "name": facility.get("name", "Unknown"),
            "distance": round(facility.get("distance", 0)),
            "place_id": facility.get("place_id", ""),
            "rating": facility.get("rating", 0),
            "types": facility.get("types", [])
        })
    
    return {
        "total": len(simplified_facilities),
        "facilities": simplified_facilities
    }

async def get_disaster_risk_data(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """災害リスクデータ取得（プレースホルダー版）"""
    return {
        "flood_risk": 0.2,  # 低リスク
        "earthquake_risk": 0.3,  # 中リスク
        "landslide_risk": 0.1  # 低リスク
    }

async def get_crime_safety_data(session: aiohttp.ClientSession, coordinates: Dict[str, float]) -> Dict:
    """犯罪・安全データ取得（プレースホルダー版）"""
    return {
        "safety_score": 75,
        "crime_rate": "low",
        "safety_index": 7.5
    }

def calculate_environment_score_with_temples(environment_data: Dict) -> float:
    """環境スコア計算（プレースホルダー版）"""
    if not environment_data or environment_data.get("total", 0) == 0:
        return 60.0
    
    total = environment_data.get("total", 0)
    base_score = min(60, total * 8)
    
    # 公園や自然環境の評価
    parks = [f for f in environment_data.get("facilities", []) if "park" in f.get("types", [])]
    park_score = min(25, len(parks) * 5)
    
    # 神社仏閣の静寂性評価
    temples = [f for f in environment_data.get("facilities", []) if any(t in f.get("types", []) for t in ["temple", "shrine"])]
    spiritual_score = min(15, len(temples) * 3)
    
    final_score = base_score + park_score + spiritual_score
    return round(final_score, 1)

def calculate_cultural_entertainment_score(cultural_data: Dict) -> float:
    """文化・娯楽スコア計算（プレースホルダー版）"""
    if not cultural_data or cultural_data.get("total", 0) == 0:
        return 40.0
    
    total = cultural_data.get("total", 0)
    base_score = min(50, total * 6)
    
    facilities = cultural_data.get("facilities", [])
    
    # 多様性評価
    types_found = set()
    for facility in facilities:
        facility_types = facility.get("types", [])
        for ftype in facility_types:
            if ftype in ["library", "museum", "movie_theater", "gym", "amusement_park"]:
                types_found.add(ftype)
    
    diversity_score = min(30, len(types_found) * 6)
    
    # 距離評価
    distance_score = 0
    for facility in facilities[:5]:
        distance = facility.get("distance", float('inf'))
        if distance <= 1000:
            distance_score += 4
        elif distance <= 2000:
            distance_score += 2
        else:
            distance_score += 1
    
    distance_score = min(20, distance_score)
    
    final_score = base_score + diversity_score + distance_score
    return round(final_score, 1)
