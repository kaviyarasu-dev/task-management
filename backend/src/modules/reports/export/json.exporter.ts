/**
 * JSON Export utilities for report data
 */

import type { ExportMetadata, JSONExportOptions } from './export.types';

/**
 * Export data to JSON format
 * Optionally includes metadata and pretty printing
 */
export function exportToJSON<T>(
  data: T,
  metadata?: Partial<ExportMetadata>,
  options: JSONExportOptions = {}
): string {
  const { includeMetadata = false, prettyPrint = false } = options;

  let output: unknown;

  if (includeMetadata && metadata) {
    output = {
      metadata: {
        generatedAt: metadata.generatedAt || new Date().toISOString(),
        tenantId: metadata.tenantId,
        generatedBy: metadata.generatedBy,
        reportType: metadata.reportType,
        ...(metadata.filters && { filters: metadata.filters }),
      },
      data,
    };
  } else {
    output = {
      generatedAt: new Date().toISOString(),
      data,
    };
  }

  return prettyPrint ? JSON.stringify(output, null, 2) : JSON.stringify(output);
}

/**
 * Export data to JSON with full metadata
 */
export function exportToJSONWithMetadata<T>(
  data: T,
  metadata: ExportMetadata,
  prettyPrint = true
): string {
  return exportToJSON(data, metadata, {
    includeMetadata: true,
    prettyPrint,
  });
}
