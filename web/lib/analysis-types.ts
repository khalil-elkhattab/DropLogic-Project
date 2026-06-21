import type { ProductFinancials } from '@/components/results/NetProfitCard';
import type { SalesTrendPoint } from '@/components/results/SalesTrendChart';
import type { ActiveCompetitor } from '@/components/results/ActiveCompetitorsTable';

export type AnalysisMetrics = {
  logic_score?: string;
  sentiment?: string;
  saturation?: string;
  net_margin?: string;
};

export type AnalysisPayload = {
  analysis_id?: string;
  product_name?: string;
  market?: string;
  metrics?: AnalysisMetrics;
  financials?: ProductFinancials;
  sales_trend?: {
    points: SalesTrendPoint[];
    direction: string;
    delta_pct: number;
  };
  active_competitors?: ActiveCompetitor[];
  intercepted_stores?: ActiveCompetitor[];
  audience_phrases?: string[];
  raw_assets?: RawAsset[];
  assets?: RawAsset[];
  error?: string;
  status?: string;
};

export type RawAsset = {
  id?: string;
  title?: string;
  desc?: string;
  duration?: string;
  video_url?: string;
  videoUrl?: string;
  play?: string;
  wmplay?: string;
  platform?: string;
};
