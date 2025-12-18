import { api } from "encore.dev/api";
import db from "../db";

export interface ErrorStats {
  total_errors: number;
  by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  by_type: Array<{ error_type: string; count: number }>;
  by_component: Array<{ component_name: string; count: number }>;
  recent_errors: number;
  resolved_count: number;
  unresolved_count: number;
}

export const getErrorStats = api(
  { method: "GET", path: "/errors/stats", expose: true },
  async (): Promise<ErrorStats> => {
    const totalResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM client_errors
    `;
    
    const severityCounts = await db.query<{ severity: string; count: number }>`
      SELECT severity, COUNT(*) as count
      FROM client_errors
      GROUP BY severity
    `;
    
    const typeCounts = await db.query<{ error_type: string; count: number }>`
      SELECT error_type, COUNT(*) as count
      FROM client_errors
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const componentCounts = await db.query<{ component_name: string; count: number }>`
      SELECT component_name, COUNT(*) as count
      FROM client_errors
      GROUP BY component_name
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const recentResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM client_errors
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;
    
    const resolvedResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM client_errors
      WHERE resolved = true
    `;
    
    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    severityCounts?.forEach(row => {
      if (row.severity in bySeverity) {
        bySeverity[row.severity as keyof typeof bySeverity] = row.count;
      }
    });
    
    return {
      total_errors: totalResult?.count || 0,
      by_severity: bySeverity,
      by_type: typeCounts || [],
      by_component: componentCounts || [],
      recent_errors: recentResult?.count || 0,
      resolved_count: resolvedResult?.count || 0,
      unresolved_count: (totalResult?.count || 0) - (resolvedResult?.count || 0)
    };
  }
);
