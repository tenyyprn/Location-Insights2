import axios from 'axios';

// APIベースURL - ポート8000に変更してテスト
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 本番では相対パス（同じドメイン）
  : 'http://localhost:8000'; // ポート8000でテスト

// 以下、既存のコード
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);

// ... 既存のコードは省略（同じ内容）