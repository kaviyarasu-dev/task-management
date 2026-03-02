import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../../config';

/** Template cache to avoid re-reading files */
const templateCache = new Map<string, string>();

/** Available email templates */
export type EmailTemplate =
  | 'task-assigned'
  | 'task-completed'
  | 'user-invite'
  | 'reminder'
  | 'daily-digest'
  | 'scheduled-report';

/**
 * Load a template file from disk, with caching in production.
 */
function loadTemplate(templateId: EmailTemplate): string {
  if (config.NODE_ENV === 'production' && templateCache.has(templateId)) {
    return templateCache.get(templateId)!;
  }

  const templatePath = path.resolve(config.EMAIL_TEMPLATE_PATH, `${templateId}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templateId}`);
  }

  const content = fs.readFileSync(templatePath, 'utf-8');

  if (config.NODE_ENV === 'production') {
    templateCache.set(templateId, content);
  }

  return content;
}

/**
 * Simple Handlebars-like template rendering.
 * Supports:
 *   - {{variable}} - variable substitution
 *   - {{#if variable}}...{{/if}} - conditional blocks
 *   - {{#if variable}}...{{else}}...{{/if}} - if/else blocks
 */
export function renderTemplate(
  templateId: EmailTemplate,
  variables: Record<string, unknown>
): string {
  let html = loadTemplate(templateId);

  // Process if/else blocks
  html = html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, ifContent, elseContent) => {
      const value = variables[key];
      return value ? ifContent : elseContent;
    }
  );

  // Process simple if blocks (without else)
  html = html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, content) => {
      const value = variables[key];
      return value ? content : '';
    }
  );

  // Replace variables
  html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    // Escape HTML to prevent XSS
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  });

  return html;
}

/**
 * Clear the template cache (useful for testing or hot-reloading).
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
