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
const allBodyDefaults = BodyDefaults as Record<string, any>;
const {
  popupPosition: _p1,
  popupDisplayDelay: _p2,
  popupWidth: _p3,
  popupHeight: _p4,
  popupBackgroundColor: _p5,
  popupBackgroundImage: _p6,
  popupOverlay_backgroundColor: _p7,
  popupCloseButton_position: _p8,
  popupCloseButton_backgroundColor: _p9,
  popupCloseButton_iconColor: _p10,
  popupCloseButton_borderRadius: _p11,
  popupCloseButton_margin: _p12,
  popupCloseButton_action: _p13,
  ...bodyRest
} = allBodyDefaults;

export const BODY_DEFAULTS = bodyRest as BodyValues;

export const ROW_DEFAULTS = { ...RowDefaults } as RowValues;

export const COLUMN_DEFAULTS = { ...ColumnDefaults } as ColumnValues;
