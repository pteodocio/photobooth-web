export class AppConstants {
  static readonly defaultCountdownSeconds = 8
  static readonly defaultShotIntervalSeconds = 5

  // Composite Strip Geometry (300 DPI high-res)
  static readonly stripWidth = 1200
  static readonly stripHeight = 3600

  // 4-Cut dimensions (Single Column)
  static readonly fourCutSlotWidth = 1040
  static readonly fourCutSlotHeight = 720
  static readonly fourCutMarginX = 80
  static readonly fourCutMarginTop = 120
  static readonly fourCutGutter = 40

  // 6-Cut dimensions (2 vertical columns, 3 on each side)
  static readonly sixCutSlotWidth = 500
  static readonly sixCutSlotHeight = 950
  static readonly sixCutMarginX = 80
  static readonly sixCutMarginTop = 130
  static readonly sixCutGutterX = 40
  static readonly sixCutGutterY = 40

  // Visual cues
  static readonly flashDurationMs = 120
  static readonly flashOpacity = 0.7
}
