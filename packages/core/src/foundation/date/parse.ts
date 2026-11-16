// Reading a date someone typed, in the order their locale writes dates. The
// order, separators and month names all come from `Intl`, so "16.10.2026" is
// October 16 in German, "10/16/2026" is in American English, and "16 oct 2026"
// works in French and English alike.
import { dateFormatter, formatDate, monthNames, weekdayNames } from "./format"
import { dateParts, isoDate, type ISODate } from "./plain-date"

/**
 * A date field's part, in the order a locale writes it.
 * @stable
 */
type DateField = "year" | "month" | "day"

/**
 * How a locale writes a date in numbers, from `datePattern`.
 * @stable
 */
type DatePattern = {
  /** The fields in the locale's order, like `["month", "day", "year"]` in American English. */
  fields: DateField[]
  /** What goes between the fields, like `"/"` or `"."`. */
  separator: string
  /** A placeholder for an empty field, like `"MM/DD/YYYY"`, `"TT.MM.JJJJ"` in German or `"ДД.ММ.ГГГГ"` in Russian. */
  placeholder: string
  /** December 31 of this year in the locale's numeric form, like `"12/31/2026"`, for a hint that shows the order. */
  example: string
}

// Marks that set text direction, which right-to-left locales put around
// separators. They're invisible, so neither a hint nor a parser should keep them.
const directionMarks = /[‎‏؜]/g

const fieldLetters = { year: "Y", month: "M", day: "D" }
const numericDate: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}

const patterns = new Map<string, DatePattern>()

/**
 * How a locale writes a date in numbers: its field order, separator, a placeholder and an example.
 * @stable
 */
function datePattern(locale?: string) {
  const key = locale ?? ""
  let pattern = patterns.get(key)
  if (!pattern) {
    patterns.set(key, (pattern = readPattern(locale)))
  }
  return pattern
}

function readPattern(locale: string | undefined) {
  const year = new Date().getFullYear()
  const parts = dateFormatter(locale, numericDate).formatToParts(
    Date.UTC(year, 11, 31)
  )
  const names = fieldNames(locale)
  const fields: DateField[] = []
  let separator = ""
  let placeholder = ""
  for (const part of parts) {
    const value = part.value.replace(directionMarks, "")
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      fields.push(part.type)
      placeholder += names[part.type].repeat(part.type === "year" ? 4 : 2)
    } else {
      if (fields.length === 1 && !separator) {
        separator = value
      }
      placeholder += value
    }
  }
  const example = parts
    .map((part) => part.value.replace(directionMarks, ""))
    .join("")
  return { fields, separator, placeholder, example }
}

// The letter each field's placeholder repeats: the first letter of its name in
// the locale when the script has capitals ("T" for Tag, "J" for Jahr), else
// the English one.
function fieldNames(locale: string | undefined) {
  try {
    const names = new Intl.DisplayNames(locale, { type: "dateTimeField" })
    const letter = (field: DateField) => {
      const first = names.of(field)?.[0]?.toLocaleUpperCase(locale)
      return first && first !== first.toLocaleLowerCase(locale)
        ? first
        : fieldLetters[field]
    }
    return { year: letter("year"), month: letter("month"), day: letter("day") }
  } catch {
    return fieldLetters
  }
}

/**
 * The ISO date in text someone typed, or undefined when it isn't a real date.
 * It reads the locale's order with any separator ("16.10.2026", "16/10/26",
 * "16 10 2026"), digits alone ("16102026"), month names ("16 Oct 2026",
 * "October 16"), the locale's medium, long and full dates as `Intl` writes
 * them, weekday included, the locale's own digits, and ISO dates. A missing
 * year is `referenceDate`'s, today's by default. Years read in the locale's calendar,
 * like Buddhist years in Thai, and in the era they're written in, like
 * Japanese "R8/10/16". A two-digit year lands in the hundred years that
 * end 20 years after the reference year: "26" is 2026 and "70" is 1970 in 2026.
 * @stable
 */
function parseDate(
  text: string,
  locale?: string,
  options: { referenceDate?: ISODate } = {}
) {
  const normalized = toLatinDigits(
    text.replace(directionMarks, "").trim(),
    locale
  )
  if (!normalized) {
    return undefined
  }
  const { fields } = datePattern(locale)
  // Kyrgyz writes January 5 as "2026-05-01", so there it isn't an ISO date.
  if (dateParts(normalized) && !(fields[0] === "year" && fields[1] === "day")) {
    return normalized
  }
  const referenceYear =
    Number((options.referenceDate ?? "").slice(0, 4)) ||
    new Date().getFullYear()
  const written = parseWrittenDate(normalized, locale, referenceYear)
  if (written) {
    return written
  }

  let namedMonth: number | undefined
  let era: number | undefined
  const numbers: string[] = []
  for (const token of normalized
    .toLocaleLowerCase(locale)
    .match(/\p{N}+|[\p{L}\p{M}]+/gu) ?? []) {
    if (/^\d+$/.test(token)) {
      numbers.push(token)
      continue
    }
    const month = monthFromName(token, locale)
    if (era === undefined && erasOf(locale).offsets.has(token)) {
      era = erasOf(locale).offsets.get(token)
    } else if (month !== undefined && namedMonth === undefined) {
      namedMonth = month
    } else if (!isPatternWord(token, locale)) {
      return undefined
    }
  }

  const values: Partial<Record<DateField, string>> = {}
  if (namedMonth !== undefined) {
    if (numbers.length > 2 || numbers.length === 0) {
      return undefined
    }
    // With one number beside the name, it's the day: "October 16". With two,
    // one of three digits or more is the year, as in "2026 okt 16" in Swedish.
    const [first, second] = numbers
    const order: DateField[] =
      second === undefined
        ? ["day"]
        : first!.length > 2
          ? ["year", "day"]
          : second.length > 2
            ? ["day", "year"]
            : styleOrder(locale, "long").filter((field) => field !== "month")
    order.forEach((field, index) => (values[field] = numbers[index]))
    values.month = String(namedMonth)
  } else if (numbers.length === 1) {
    const digits = numbers[0]!
    if (digits.length !== 8 && digits.length !== 6) {
      return undefined
    }
    const yearLength = digits.length - 4
    let offset = 0
    for (const field of yearLength === 2
      ? styleOrder(locale, "short")
      : fields) {
      const length = field === "year" ? yearLength : 2
      values[field] = digits.slice(offset, (offset += length))
    }
  } else if (numbers.length === 2 || numbers.length === 3) {
    // Some locales order their numeric and short dates apart, like Zulu
    // "2026-12-31" and "12/31/26": a long year picks the order with the year
    // where it is, and short numbers read in the short date's order.
    const short = styleOrder(locale, "short")
    const year = numbers.findIndex((number) => number.length > 2)
    const order =
      year === -1 || numbers.length === 2
        ? short
        : ([fields, short].find((order) => order[year] === "year") ?? fields)
    order
      .filter((field) => numbers.length === 3 || field !== "year")
      .forEach((field, index) => (values[field] = numbers[index]))
  } else {
    return undefined
  }

  if (era !== undefined && values.year !== undefined) {
    for (const year of eraYears(values.year, era, referenceYear)) {
      const date = isoDate(year, Number(values.month), Number(values.day))
      if (date && eraOf(date, locale) === era) {
        return date
      }
    }
    return undefined
  }
  const offset = yearOffset(locale)
  const year =
    values.year === undefined
      ? referenceYear
      : fullYear(values.year, referenceYear + offset) - offset
  return isoDate(year, Number(values.month), Number(values.day))
}

const styleOrders = new Map<string, DateField[]>()

// The fields in the order of the locale's short or long date, which can
// differ from its numeric one: Swedish writes "2026-10-16" but "16 oktober 2026".
function styleOrder(locale: string | undefined, dateStyle: "short" | "long") {
  const key = `${locale ?? ""}|${dateStyle}`
  let order = styleOrders.get(key)
  if (!order) {
    order = dateFormatter(locale, { dateStyle })
      .formatToParts(Date.UTC(2026, 9, 16))
      .flatMap((part) =>
        part.type === "day" || part.type === "month" || part.type === "year"
          ? [part.type]
          : []
      )
    styleOrders.set(key, order)
  }
  return order
}

const writtenStyles = ["full", "long", "medium"] as const

type WrittenDate = {
  dateStyle: (typeof writtenStyles)[number]
  pattern: RegExp
  fields: (DateField | "era")[]
  months: Map<string, number>
}

const writtenDates = new Map<string, WrittenDate[]>()

// The text as a written date is compared: without spaces, joiners or case,
// with Latin digits, and with the apostrophe a keyboard types.
function compact(text: string, locale: string | undefined) {
  return toLatinDigits(text.replace(directionMarks, ""), locale)
    .replace(/[\s\u200c\u200d]/gu, "")
    .replace(/[’ʼ׳]/gu, "'")
    .toLocaleLowerCase(locale)
}

// A date in the locale's medium, long or full form, read part by part as
// `Intl` writes it, so names with spaces, dots or a prefix read whole, like
// Irish "Deireadh Fómhair" or Hebrew "באוקטובר".
function parseWrittenDate(
  text: string,
  locale: string | undefined,
  referenceYear: number
) {
  const typed = compact(text, locale)
  for (const { dateStyle, pattern, fields, months } of writtenDatesOf(locale)) {
    const match = pattern.exec(typed)
    if (!match) {
      continue
    }
    const values: Partial<Record<DateField | "era", string>> = {}
    fields.forEach((field, index) => (values[field] = match[index + 1]))
    const { offsets, firstYears } = erasOf(locale)
    const era = values.era === undefined ? undefined : offsets.get(values.era)
    const written = firstYears.has(values.year ?? "")
      ? "1"
      : (values.year ?? "")
    const offset = yearOffset(locale)
    const years =
      era === undefined
        ? [fullYear(written, referenceYear + offset) - offset]
        : eraYears(written, era, referenceYear)
    for (const year of years) {
      const date = isoDate(
        year,
        months.get(values.month ?? "") ?? 0,
        Number(values.day)
      )
      // Only a date that writes back as the same text, so a wrong weekday or
      // era doesn't read as some other date.
      if (
        date &&
        compact(formatDate(date, locale, { dateStyle }), locale) === typed
      ) {
        return date
      }
    }
  }
  return undefined
}

function writtenDatesOf(locale: string | undefined) {
  const key = locale ?? ""
  let dates = writtenDates.get(key)
  if (!dates) {
    writtenDates.set(
      key,
      (dates = writtenStyles.map((dateStyle) =>
        readWrittenDate(locale, dateStyle)
      ))
    )
  }
  return dates
}

function readWrittenDate(
  locale: string | undefined,
  dateStyle: WrittenDate["dateStyle"]
) {
  const formatter = dateFormatter(locale, { dateStyle })
  const partOf = (type: string, month: number, day: number) =>
    formatter
      .formatToParts(Date.UTC(2026, month, day))
      .find((part) => part.type === type)?.value
  const months = new Map<string, number>()
  for (let month = 0; month < 12; month++) {
    const name = partOf("month", month, 16)
    if (name) {
      months.set(compact(name, locale), month + 1)
    }
  }
  const weekdays = new Set<string>()
  for (let day = 11; day < 18; day++) {
    const name = partOf("weekday", 9, day)
    if (name) {
      weekdays.add(compact(name, locale))
    }
  }
  const { offsets, firstYears } = erasOf(locale)
  const fields: WrittenDate["fields"] = []
  const source = formatter
    .formatToParts(Date.UTC(2026, 9, 16))
    .map((part) => {
      if (part.type === "day") {
        fields.push("day")
        return "(\\d+)"
      }
      if (part.type === "year") {
        fields.push("year")
        return `(\\d+${firstYears.size ? `|${anyOf(firstYears)}` : ""})`
      }
      if (part.type === "era" && offsets.size) {
        fields.push("era")
        return `(${anyOf(offsets.keys())})`
      }
      if (part.type === "month") {
        fields.push("month")
        return `(${anyOf(months.keys())})`
      }
      if (part.type === "weekday") {
        return `(?:${anyOf(weekdays)})`
      }
      return escapeRegExp(compact(part.value, locale))
    })
    .join("")
  return { dateStyle, pattern: new RegExp(`^${source}$`, "u"), fields, months }
}

const anyOf = (names: Iterable<string>) =>
  [...names].map(escapeRegExp).join("|")

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const yearOffsets = new Map<string, number>()

// How far the years a locale writes are from Gregorian years, like 543 for
// the Buddhist years of Thai. Japanese years restart with each era, so they read as Gregorian.
function yearOffset(locale: string | undefined) {
  const key = locale ?? ""
  let offset = yearOffsets.get(key)
  if (offset === undefined) {
    yearOffsets.set(key, (offset = readYearOffset(locale)))
  }
  return offset
}

function readYearOffset(locale: string | undefined) {
  const formatter = dateFormatter(locale, numericDate)
  const parts = formatter.formatToParts(Date.UTC(2026, 11, 31))
  const year = Number(
    toLatinDigits(
      parts.find((part) => part.type === "year")?.value ?? "",
      locale
    )
  )
  if (!year || formatter.resolvedOptions().calendar === "japanese") {
    return 0
  }
  return year - 2026
}

type Eras = {
  offsets: Map<string, number>
  firstYears: Set<string>
}

const eraCache = new Map<string, Eras>()
const eraWidths = ["narrow", "short", "long"] as const

// Each era a locale writes, like Japanese "令和" or "R", with the Gregorian
// year before its first, and words for a first year, like "元". An era that
// counts its years down, like "民國前", has no such year, so it isn't read.
function erasOf(locale: string | undefined) {
  const key = locale ?? ""
  let eras = eraCache.get(key)
  if (!eras) {
    eras = { offsets: new Map(), firstYears: new Set() }
    const writesEras = [
      numericDate,
      ...writtenStyles.map((dateStyle) => ({ dateStyle })),
    ].some((options) =>
      dateFormatter(locale, options)
        .formatToParts(Date.UTC(2026, 9, 16))
        .some((part) => part.type === "era")
    )
    const partsOf = (era: (typeof eraWidths)[number], time: number) => {
      const parts = dateFormatter(locale, { year: "numeric", era })
        .formatToParts(time)
        .map((part) => ({ ...part, value: compact(part.value, locale) }))
      const valueOf = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? ""
      return { era: valueOf("era"), year: valueOf("year") }
    }
    const found = new Map<string, { offset: number | null; year: number }>()
    for (let year = 1868; writesEras && year <= 2100; year++) {
      const { era, year: value } = partsOf("short", Date.UTC(year, 0, 1))
      if (!era) {
        break
      }
      const offset = year - Number(value)
      const known = found.get(era)
      found.set(era, {
        offset: !known || known.offset === offset ? offset : null,
        year: known?.year ?? year,
      })
    }
    for (const { offset, year } of found.values()) {
      if (offset === null) {
        continue
      }
      for (const width of eraWidths) {
        const name = partsOf(width, Date.UTC(year, 0, 1)).era
        if (name) {
          eras.offsets.set(name, offset)
        }
        const first = partsOf(width, Date.UTC(offset + 1, 11, 31)).year
        if (!/\d/.test(first)) {
          eras.firstYears.add(first)
        }
      }
    }
    eraCache.set(key, eras)
  }
  return eras
}

// The offset of the era a date is in.
function eraOf(date: ISODate, locale: string | undefined) {
  const { year, month, day } = dateParts(date)!
  const era = dateFormatter(locale, { year: "numeric", era: "short" })
    .formatToParts(Date.UTC(year, month - 1, day))
    .find((part) => part.type === "era")?.value
  return erasOf(locale).offsets.get(compact(era ?? "", locale))
}

// The Gregorian years a year written in an era can be: as written, or two
// digits near the reference, like "05.01.69 BE" for Buddhist 2569 in German.
function eraYears(text: string, offset: number, referenceYear: number) {
  return [Number(text), fullYear(text, referenceYear - offset)].map(
    (year) => year + offset
  )
}

function fullYear(text: string, referenceYear: number) {
  const year = Number(text)
  if (text.length > 2) {
    return year
  }
  // The century that puts a two-digit year 80 years before to 20 after the reference.
  const century = Math.floor((referenceYear + 20) / 100) * 100
  return century + year > referenceYear + 20
    ? century - 100 + year
    : century + year
}

const monthLookups = new Map<string, Map<string, number>>()

// The month a word names, matching the locale's long and short names in both
// grammatical forms, and any unambiguous start of three letters or more.
function monthFromName(word: string, locale: string | undefined) {
  const key = locale ?? ""
  let lookup = monthLookups.get(key)
  if (!lookup) {
    monthLookups.set(key, (lookup = monthLookup(locale)))
  }
  const exact = lookup.get(word)
  if (exact !== undefined || word.length < 3) {
    return exact
  }
  let found: number | undefined
  for (const [name, month] of lookup) {
    if (name.startsWith(word)) {
      if (found !== undefined && found !== month) {
        return undefined
      }
      found = month
    }
  }
  return found
}

function monthLookup(locale: string | undefined) {
  const lookup = new Map<string, number>()
  const add = (name: string, month: number) =>
    lookup.set(name.toLocaleLowerCase(locale).replace(/\.$/, ""), month)
  for (const width of ["long", "short"] as const) {
    monthNames(locale, width).forEach((name, index) => add(name, index + 1))
    // Inside a date, some languages use another form: "16 января", not "январь".
    const inDate = dateFormatter(locale, { day: "numeric", month: width })
    for (let index = 0; index < 12; index++) {
      const name = inDate
        .formatToParts(Date.UTC(2026, index, 16))
        .find((part) => part.type === "month")
      if (name) {
        add(name.value, index + 1)
      }
    }
  }
  return lookup
}

const patternWords = new Map<string, Set<string>>()

// Words a typed or pasted date may carry besides the month: the ones a locale
// writes between a date's numbers, like Korean "년" or Spanish "de", and
// weekday names, as in "Fri, Oct 16, 2026".
function isPatternWord(word: string, locale: string | undefined) {
  const key = locale ?? ""
  let words = patternWords.get(key)
  if (!words) {
    words = new Set()
    for (const options of [
      { dateStyle: "short" },
      { dateStyle: "long" },
    ] as const) {
      for (const part of dateFormatter(locale, options).formatToParts(
        Date.UTC(2026, 9, 16)
      )) {
        if (part.type === "literal") {
          for (const literal of part.value
            .toLocaleLowerCase(locale)
            .match(/[\p{L}\p{M}]+/gu) ?? []) {
            words.add(literal)
          }
        }
      }
    }
    for (const width of ["long", "short"] as const) {
      for (const name of weekdayNames(locale, width)) {
        words.add(name.toLocaleLowerCase(locale).replace(/\.$/, ""))
      }
    }
    patternWords.set(key, words)
  }
  return words.has(word)
}

const digitMaps = new Map<string, Map<string, string>>()

// The text with the locale's own digits, like Arabic-Indic "١٦", read as Latin ones.
function toLatinDigits(text: string, locale: string | undefined) {
  const key = locale ?? ""
  let digits = digitMaps.get(key)
  if (!digits) {
    const native = new Intl.NumberFormat(locale, { useGrouping: false }).format(
      9876543210
    )
    digits = new Map(
      [...native].map((digit, index) => [digit, String(9 - index)])
    )
    digitMaps.set(key, digits)
  }
  const latin = digits
  // Full-width digits, which East Asian input methods commit, fold to ASCII.
  return text.replace(
    /\p{Nd}/gu,
    (digit) => latin.get(digit) ?? digit.normalize("NFKC")
  )
}

export { type DateField, datePattern, type DatePattern, parseDate }
