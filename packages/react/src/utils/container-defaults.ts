/**
 * Default values for container components (Body, Row, Column).
 *
 * Runtime values come from @unlayer/exporters (extracted from the editor
 * schema at generation time). Types come from @unlayer/types
 * (generated from the same schema). Both are single source of truth.
 *
 * Imported by both render-to-json.ts and extract-head.ts to ensure the
 * JSON output and head CSS always use consistent defaults.
 */

import {
  BodyDefaults,
  RowDefaults,
  ColumnDefaults,
} from "@unlayer/exporters";
import type { BodyValues, RowValues, ColumnValues } from "@unlayer-internal/shared-elements";

// Body defaults from the editor schema.
// Filter out popup-specific fields that aren't relevant for email/web rendering.
export const BODY_DEFAULTS = Object.fromEntries(Object.entries(BodyDefaults).filter(([key]) => !key.startsWith("popup"))) as BodyValues;

export const ROW_DEFAULTS = { ...RowDefaults } as RowValues;

export const COLUMN_DEFAULTS = { ...ColumnDefaults } as ColumnValues;
