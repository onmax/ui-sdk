// Showing numbers in someone's language through `Intl.NumberFormat`, with
// formatters built once per locale and options. Pure, so it runs on the server too.
import { decimalsOf } from "./steps"

/**
 * How values show: `Intl.NumberFormat` options, or a function of the value.
 * @stable
 */
type NumberFormat = Intl.NumberFormatOptions | ((value: number) => string)

const formatters = new Map<string, Intl.NumberFormat>()

/**
 * The `Intl.NumberFormat` for a locale and options, built once and reused,
 * since formatters are slow to build.
 * @experimental
 */
function numberFormatter(
  locale?: string,
  options: Intl.NumberFormatOptions = {}
) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options)
    formatters.set(key, formatter)
  }
  return formatter
}

// Reading a formatter's resolved options builds a new object each time, so
// its default decimals are read once.
const defaultDecimals = new WeakMap<Intl.NumberFormat, number>()

function intlDecimals(format: Intl.NumberFormatOptions | undefined) {
  const formatter = numberFormatter(undefined, format)
  let decimals = defaultDecimals.get(formatter)
  if (decimals === undefined) {
    decimals = formatter.resolvedOptions().maximumFractionDigits ?? 0
    defaultDecimals.set(formatter, decimals)
  }
  return decimals
}

// Intl shows at most three decimals by default, which would show 0.0001 as 0.
// Without your own maximum, a value shows its step's decimals, and never fewer
// than Intl would, so yen stay whole and dollars show cents.
function displayOptions(
  format: Intl.NumberFormatOptions | undefined,
  step: number
) {
  const options = { ...format }
  if (
    options.maximumFractionDigits === undefined &&
    options.maximumSignificantDigits === undefined
  ) {
    const decimals = decimalsOf(step) + (options.style === "percent" ? -2 : 0)
    options.maximumFractionDigits = Math.max(
      options.minimumFractionDigits ?? 0,
      decimals,
      intlDecimals(format)
    )
  }
  return options
}

/**
 * A value as people read it: the function's text, or `Intl.NumberFormat` in
 * the locale, like "$1,234.50", "45%" or "1.2K". Empty for null and non-finite values.
 * @experimental
 */
function formatNumber(
  value: number | null,
  locale?: string,
  format?: NumberFormat
) {
  if (value === null || !Number.isFinite(value)) {
    return ""
  }
  if (typeof format === "function") {
    return format(value)
  }
  const formatter = numberFormatter(locale, format)
  const text = formatter.format(value)
  return /\p{Nd}/u.test(text)
    ? text
    : signedParts(formatter, value)
        .map((part) => part.value)
        .join("")
}

/**
 * A range as people read it in a locale, like "$5 – $10" or "5–10%", with what
 * both ends share written once. A format function joins its two texts with a dash.
 * @experimental
 */
function formatNumberRange(
  start: number,
  end: number,
  locale?: string,
  format?: NumberFormat
) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return ""
  }
  if (typeof format === "function") {
    return `${format(start)} – ${format(end)}`
  }
  // `formatRange` is newer than the ES2022 types, and older engines lack it.
  const formatter = numberFormatter(locale, format) as Intl.NumberFormat & {
    formatRange?: (start: number, end: number) => string
    formatRangeToParts?: (
      start: number,
      end: number
    ) => (Intl.NumberFormatPart & { source: string })[]
  }
  // `Intl` can share one minus sign between both ends, "-5–2%" for -5% to
  // -2%, which reads as -5% to 2%, so with a negative end each is written whole.
  const parts =
    (start < 0 || end < 0) && formatter.formatRangeToParts?.(start, end)
  const sources = parts ? parts.map((part) => part.source) : []
  if (parts && sources.includes("endRange")) {
    const separator = parts
      .slice(sources.lastIndexOf("startRange") + 1, sources.indexOf("endRange"))
      .map((part) => part.value)
      .join("")
    return `${formatNumber(start, locale, format)}${separator}${formatNumber(end, locale, format)}`
  }
  return formatter.formatRange
    ? formatter.formatRange(start, end)
    : `${formatter.format(start)}–${formatter.format(end)}`
}

/**
 * The parts `Intl` formats a value into, like each digit group, the decimal
 * separator and the currency sign, for styling them apart or rolling digits
 * like an odometer. A format function's text is one literal part.
 * @experimental
 */
function formatNumberToParts(
  value: number | null,
  locale?: string,
  format?: NumberFormat
) {
  if (value === null || !Number.isFinite(value)) {
    return [] as Intl.NumberFormatPart[]
  }
  if (typeof format === "function") {
    return [
      { type: "literal", value: format(value) },
    ] as Intl.NumberFormatPart[]
  }
  return signedParts(numberFormatter(locale, format), value)
}

// Arabic and Hebrew write one or two of some units as a word alone, like
// "يومان" for 2 days, and `Intl` drops its sign there, so -2 days would show
// as 2. The sign goes back in front, as the locale writes it for other numbers.
function signedParts(formatter: Intl.NumberFormat, value: number) {
  const parts = formatter.formatToParts(value)
  if (value === 0 || parts.some((part) => part.type === "integer")) {
    return parts
  }
  const sample = formatter.formatToParts(Math.sign(value) * 12345.6)
  const sign = sample.findIndex(
    (part) => part.type === "minusSign" || part.type === "plusSign"
  )
  return sign !== -1 &&
    sign < sample.findIndex((part) => part.type === "integer")
    ? [...sample.slice(0, sign + 1), ...parts]
    : parts
}

export {
  displayOptions,
  formatNumber,
  formatNumberRange,
  formatNumberToParts,
  type NumberFormat,
  numberFormatter,
}
