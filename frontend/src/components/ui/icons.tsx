import React from 'react';

// Simple emoji-based icons as fallback
export const SimpleIcons = {
  User: () => <span>👤</span>,
  Users: () => <span>👥</span>,
  Baby: () => <span>👶</span>,
  Heart: () => <span>❤️</span>,
  AlertTriangle: () => <span>⚠️</span>,
  CheckCircle: () => <span>✅</span>,
  Info: () => <span>ℹ️</span>,
  Star: () => <span>⭐</span>,
  TrendingUp: () => <span>📈</span>,
  Home: () => <span>🏠</span>,
  Bot: () => <span>🤖</span>
};

// Icon component with fallback
interface IconProps {
  className?: string;
}

export const UserIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>👤</span>
);

export const UsersIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>👥</span>
);

export const BabyIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>👶</span>
);

export const HeartIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>❤️</span>
);

export const AlertTriangleIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>⚠️</span>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>✅</span>
);

export const InfoIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>ℹ️</span>
);

export const StarIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>⭐</span>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>📈</span>
);

export const HomeIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>🏠</span>
);

export const BotIcon: React.FC<IconProps> = ({ className }) => (
  <span className={className}>🤖</span>
);
