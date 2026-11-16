import { afterEach, describe, expect, test, vi } from "vitest"
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  dateParts,
  datePattern,
  daysBetween,
  daysInMonth,
  endOfMonth,
  endOfWeek,
  firstDayOfWeek,
  formatDate,
  formatDateRange,
  isISODate,
  isoDate,
  monthGrid,
  monthNames,
  parseDate,
  startOfWeek,
  toISODate,
  todayDate,
  weekday,
  weekdayNames,
} from "../src/foundation/date/date"

afterEach(() => {
  vi.useRealTimers()
})

describe("ISO dates", () => {
  test("a real date is an ISO date, and an impossible one isn't", () => {
    expect(isISODate("2026-10-16")).toBe(true)
    expect(isISODate("2028-02-29")).toBe(true)
    expect(isISODate("2026-02-29")).toBe(false)
    expect(isISODate("2026-13-01")).toBe(false)
    expect(isISODate("2026-1-16")).toBe(false)
    expect(isISODate("2026-10-16T00:00")).toBe(false)
    expect(isISODate(null)).toBe(false)
  })

  test("dates split into their parts and back", () => {
    expect(dateParts("2026-10-16")).toEqual({ year: 2026, month: 10, day: 16 })
    expect(isoDate(2026, 10, 16)).toBe("2026-10-16")
    expect(isoDate(33, 1, 5)).toBe("0033-01-05")
    expect(isoDate(2026, 2, 30)).toBeUndefined()
  })

  test("a Date gives the year, month and day its user saw, in any time zone", () => {
    expect(toISODate(new Date(2026, 9, 16))).toBe("2026-10-16")
    expect(toISODate(new Date(2026, 9, 16, 23, 59))).toBe("2026-10-16")
    expect(toISODate(new Date(Number.NaN))).toBeUndefined()
  })

  test("anything with a year, month and day converts, like a Temporal.PlainDate", () => {
    expect(toISODate({ year: 2026, month: 10, day: 16 })).toBe("2026-10-16")
    expect(toISODate("2026-10-16")).toBe("2026-10-16")
    expect(toISODate("October 16")).toBeUndefined()
  })

  test("months have their lengths, with February 29 in leap years only", () => {
    expect(daysInMonth(2026, 1)).toBe(31)
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(daysInMonth(1900, 2)).toBe(28)
    expect(daysInMonth(2000, 2)).toBe(29)
  })
})

describe("date arithmetic", () => {
  test("adding days crosses months, years and daylight saving changes", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
    expect(addDays("2026-03-29", -1)).toBe("2026-03-28")
    expect(addDays("2026-10-16", 365)).toBe("2027-10-16")
  })

  test("adding months keeps the day where it can", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28")
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29")
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28")
    expect(addMonths("2026-11-16", 2)).toBe("2027-01-16")
    expect(addMonths("2026-01-16", -13)).toBe("2024-12-16")
  })

  test("adding years moves February 29 to February 28 in a common year", () => {
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28")
    expect(addYears("2026-10-16", -10)).toBe("2016-10-16")
  })

  test("arithmetic stays within the years an ISO date can hold", () => {
    expect(addDays("9999-12-31", 1)).toBe("9999-12-31")
    expect(addMonths("0001-01-16", -1)).toBe("0001-01-01")
    expect(addYears("9999-06-01", 1)).toBe("9999-12-31")
  })

  test("days between counts whole days, whatever the time zone", () => {
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31)
    expect(daysBetween("2026-10-20", "2026-10-16")).toBe(-4)
    expect(daysBetween("2000-01-01", "2026-10-16")).toBe(9785)
  })

  test("weekdays count from Sunday, like Date#getDay", () => {
    expect(weekday("2026-10-16")).toBe(5)
    expect(weekday("2026-10-18")).toBe(0)
    expect(weekday("1970-01-01")).toBe(4)
    expect(weekday("1969-12-31")).toBe(3)
    expect(weekday("0001-01-01")).toBe(1)
  })

  test("weeks start on the day asked for", () => {
    expect(startOfWeek("2026-10-16")).toBe("2026-10-11")
    expect(startOfWeek("2026-10-16", 1)).toBe("2026-10-12")
    expect(startOfWeek("2026-10-12", 1)).toBe("2026-10-12")
    expect(startOfWeek("2026-10-16", 6)).toBe("2026-10-10")
    expect(endOfWeek("2026-10-16", 1)).toBe("2026-10-18")
  })

  test("the end of the month is its last day", () => {
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28")
    expect(endOfMonth("2026-10-16")).toBe("2026-10-31")
  })

  test("a date is clamped between optional bounds", () => {
    expect(clampDate("2026-10-16", "2026-10-20")).toBe("2026-10-20")
    expect(clampDate("2026-10-16", null, "2026-10-01")).toBe("2026-10-01")
    expect(clampDate("2026-10-16")).toBe("2026-10-16")
  })

  test("a date that isn't real throws, so a bad value fails loudly", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(RangeError)
  })
})

describe("month grids", () => {
  test("six weeks starting on Sunday, with the months around it filling in", () => {
    const weeks = monthGrid("2026-10-16")
    expect(weeks).toHaveLength(6)
    expect(weeks[0]).toEqual([
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ])
    expect(weeks[5]![6]).toBe("2026-11-07")
  })

  test("weeks start on the locale's day", () => {
    expect(monthGrid("2026-10-01", { weekStartsOn: 1 })[0]![0]).toBe(
      "2026-09-28"
    )
    expect(monthGrid("2026-11-01", { weekStartsOn: 1 })[0]![0]).toBe(
      "2026-10-26"
    )
  })

  test("without fixed weeks, a grid has only the weeks the month touches", () => {
    expect(monthGrid("2026-02-01", { fixedWeeks: false })).toHaveLength(4)
    expect(monthGrid("2026-10-01", { fixedWeeks: false })).toHaveLength(5)
    expect(monthGrid("2026-08-01", { fixedWeeks: false })).toHaveLength(6)
  })
})

describe("first day of the week", () => {
  test("follows the locale's region", () => {
    expect(firstDayOfWeek("en-US")).toBe(0)
    expect(firstDayOfWeek("en-GB")).toBe(1)
    expect(firstDayOfWeek("de")).toBe(1)
    expect(firstDayOfWeek("pt-BR")).toBe(0)
    expect(firstDayOfWeek("ar-EG")).toBe(6)
  })

  test("a tag's -u-fw- extension wins", () => {
    expect(firstDayOfWeek("en-US-u-fw-mon")).toBe(1)
    expect(firstDayOfWeek("de-u-fw-sun")).toBe(0)
  })

  test("engines without week info fall back to CLDR's regions", () => {
    const original = Object.getOwnPropertyDescriptors(Intl.Locale.prototype)
    // Firefox before 153 has neither getWeekInfo nor weekInfo.
    for (const key of ["getWeekInfo", "weekInfo"]) {
      if (key in Intl.Locale.prototype) {
        Reflect.deleteProperty(Intl.Locale.prototype, key)
      }
    }
    try {
      expect(firstDayOfWeek("en-CA")).toBe(0)
      expect(firstDayOfWeek("fr-FR")).toBe(1)
      expect(firstDayOfWeek("fa-IR")).toBe(6)
      expect(firstDayOfWeek("dv-MV")).toBe(5)
      expect(firstDayOfWeek("ja")).toBe(0)
    } finally {
      Object.defineProperties(Intl.Locale.prototype, original)
    }
  })

  test("a tag Intl rejects starts weeks on Monday", () => {
    expect(firstDayOfWeek("not a locale!")).toBe(1)
  })
})

describe("names and labels", () => {
  test("a date's label is its long form in the locale", () => {
    expect(formatDate("2026-10-16", "en-US")).toBe("Friday, October 16, 2026")
    expect(formatDate("2026-10-16", "de")).toBe("Freitag, 16. Oktober 2026")
  })

  test("labels never move a day, whatever the runtime's time zone", () => {
    expect(formatDate("2026-10-16", "en-US", { day: "numeric" })).toBe("16")
    expect(formatDate("0033-01-05", "en-US", { year: "numeric" })).toBe("33")
  })

  test("a locale on another calendar labels the Gregorian grid it shows", () => {
    expect(
      formatDate("2026-10-16", "fa-IR", {
        month: "numeric",
        numberingSystem: "latn",
      })
    ).toBe("10")
    expect(
      formatDate("2026-10-16", "th-TH", {
        year: "numeric",
        numberingSystem: "latn",
      })
    ).toContain("2569")
  })

  test("ranges read as one phrase, with the same spaces on every ICU", () => {
    expect(formatDateRange("2026-10-16", "2026-10-20", "en-US")).toBe(
      "Oct 16 – 20, 2026"
    )
    expect(
      formatDateRange("2026-10-01", "2026-11-01", "en-US", {
        month: "long",
        year: "numeric",
      })
    ).toBe("October – November 2026")
    expect(
      formatDateRange("2026-10-01", "2026-11-01", "ru-RU", {
        month: "long",
        year: "numeric",
      })
    ).toBe("октябрь 2026 г. – ноябрь 2026 г.")
  })

  test("month names stand alone, as a heading or a select shows them", () => {
    expect(monthNames("en-US")[9]).toBe("October")
    expect(monthNames("ru")[0]).toBe("январь")
    expect(monthNames("en-US", "short")).toHaveLength(12)
  })

  test("weekday names start on the day asked for", () => {
    expect(weekdayNames("en-US")).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ])
    expect(weekdayNames("en-US", "long", 1)[0]).toBe("Monday")
    expect(weekdayNames("en-US", "narrow", 6)).toEqual([
      "S",
      "S",
      "M",
      "T",
      "W",
      "T",
      "F",
    ])
  })

  test("today is the date in the time zone asked for", () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 9, 16, 23, 30))
    expect(todayDate("UTC")).toBe("2026-10-16")
    expect(todayDate("Asia/Tokyo")).toBe("2026-10-17")
    expect(todayDate("America/Los_Angeles")).toBe("2026-10-16")
  })
})

describe("typing a date", () => {
  test("each locale's numeric order and separator", () => {
    expect(datePattern("en-US")).toMatchObject({
      fields: ["month", "day", "year"],
      separator: "/",
    })
    expect(datePattern("de")).toMatchObject({
      fields: ["day", "month", "year"],
      separator: ".",
    })
    expect(datePattern("ja")).toMatchObject({
      fields: ["year", "month", "day"],
      separator: "/",
    })
  })

  test("placeholders use the locale's own letters where its script has capitals", () => {
    expect(datePattern("en-US").placeholder).toBe("MM/DD/YYYY")
    expect(datePattern("de").placeholder).toBe("TT.MM.JJJJ")
    expect(datePattern("ru").placeholder).toBe("ДД.ММ.ГГГГ")
    expect(datePattern("ja").placeholder).toBe("YYYY/MM/DD")
  })

  test("right-to-left locales have no invisible marks in their hint", () => {
    expect(datePattern("ar-EG").example).not.toMatch(/[‎‏؜]/)
  })

  test("reads the locale's order with any separator", () => {
    expect(parseDate("10/16/2026", "en-US")).toBe("2026-10-16")
    expect(parseDate("16.10.2026", "de")).toBe("2026-10-16")
    expect(parseDate("16/10/2026", "en-GB")).toBe("2026-10-16")
    expect(parseDate("16 10 2026", "fr")).toBe("2026-10-16")
    expect(parseDate("16-10-2026", "fr")).toBe("2026-10-16")
    expect(parseDate("2026/10/16", "ja")).toBe("2026-10-16")
  })

  test("reads the full-width digits East Asian input methods commit", () => {
    expect(parseDate("２０２６/１０/１６", "ja")).toBe("2026-10-16")
    expect(parseDate("１０/１６/２０２６", "en-US")).toBe("2026-10-16")
  })

  test("reads ISO dates in any locale", () => {
    expect(parseDate("2026-10-16", "en-US")).toBe("2026-10-16")
    expect(parseDate(" 2026-10-16 ", "de")).toBe("2026-10-16")
  })

  test("reads the locale's own order before ISO when it writes the day before the month", () => {
    const shown = formatDate("2026-01-05", "ky-KG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    expect(shown).toBe("2026-05-01")
    expect(parseDate(shown, "ky-KG")).toBe("2026-01-05")
  })

  test("reads digits alone, as a phone's number pad types them", () => {
    expect(parseDate("10162026", "en-US")).toBe("2026-10-16")
    expect(parseDate("16102026", "de")).toBe("2026-10-16")
    expect(parseDate("161026", "de", { referenceDate: "2026-01-01" })).toBe(
      "2026-10-16"
    )
  })

  test("reads short numbers in the short date's order when it differs from the numeric one", () => {
    const reference = { referenceDate: "2026-01-01" } as const
    expect(parseDate("1/5/26", "zu-ZA", reference)).toBe("2026-01-05")
    expect(parseDate("010526", "zu-ZA", reference)).toBe("2026-01-05")
    expect(parseDate("2026-01-05", "zu-ZA")).toBe("2026-01-05")
    expect(parseDate("5/1/26", "ky-KG", reference)).toBe("2026-01-05")
    expect(parseDate("31/12/2026", "ak")).toBe("2026-12-31")
    expect(parseDate("2026/12/31", "ak")).toBe("2026-12-31")
  })

  test("two-digit years land near the reference year", () => {
    expect(
      parseDate("10/16/26", "en-US", { referenceDate: "2026-01-01" })
    ).toBe("2026-10-16")
    expect(parseDate("3/4/70", "en-US", { referenceDate: "2026-01-01" })).toBe(
      "1970-03-04"
    )
    expect(parseDate("3/4/46", "en-US", { referenceDate: "2026-01-01" })).toBe(
      "2046-03-04"
    )
  })

  test("a missing year is the reference year", () => {
    expect(parseDate("10/16", "en-US", { referenceDate: "2026-01-01" })).toBe(
      "2026-10-16"
    )
    expect(parseDate("16.10.", "de", { referenceDate: "2027-05-01" })).toBe(
      "2027-10-16"
    )
  })

  test("reads month names, short or long, in the locale", () => {
    expect(parseDate("October 16, 2026", "en-US")).toBe("2026-10-16")
    expect(parseDate("Oct 16 2026", "en-US")).toBe("2026-10-16")
    expect(parseDate("16 oct. 2026", "fr")).toBe("2026-10-16")
    expect(parseDate("16 января 2026", "ru")).toBe("2026-01-16")
    expect(parseDate("16 de octubre de 2026", "es")).toBe("2026-10-16")
    expect(parseDate("octo 16", "en-US", { referenceDate: "2026-01-01" })).toBe(
      "2026-10-16"
    )
  })

  test("reads the day and year beside a month name in the order of the locale's long date", () => {
    expect(parseDate("16 oktober 2026", "sv-SE")).toBe("2026-10-16")
    expect(parseDate("16 Oktober 2026", "af-ZA")).toBe("2026-10-16")
    expect(parseDate("۱۶ اکتبر ۲۰۲۶", "fa-IR")).toBe("2026-10-16")
    expect(parseDate("2026 m. spalio 16 d.", "lt-LT")).toBe("2026-10-16")
    expect(
      parseDate("16 okt 26", "sv-SE", { referenceDate: "2026-01-01" })
    ).toBe("2026-10-16")
  })

  test("reads a number of three digits or more beside a month name as the year", () => {
    expect(parseDate("2026 okt 16", "sv-SE")).toBe("2026-10-16")
    expect(parseDate("2026 Oct 16", "en-GB")).toBe("2026-10-16")
  })

  test("reads month names whose letters carry combining marks", () => {
    expect(parseDate("16 ตุลาคม 2569", "th-TH")).toBe("2026-10-16")
    expect(parseDate("16 अक्टूबर 2026", "hi-IN")).toBe("2026-10-16")
    expect(parseDate("16 அக்டோபர், 2026", "ta-IN")).toBe("2026-10-16")
    expect(parseDate("১৬ অক্টোবর, ২০২৬", "bn-BD")).toBe("2026-10-16")
  })

  test("reads month names with spaces, dots, joiners or a prefix, as the locale writes them", () => {
    expect(parseDate("16 Deireadh Fómhair 2026", "ga-IE")).toBe("2026-10-16")
    expect(parseDate("16 ต.ค. 2569", "th-TH")).toBe("2026-10-16")
    expect(parseDate("16 ຕ.ລ. 2026", "lo-LA")).toBe("2026-10-16")
    expect(parseDate("2026 ഒക്‌ടോബർ 16", "ml-IN")).toBe("2026-10-16")
    expect(parseDate("2026 ഒക്ടോബർ 16", "ml-IN")).toBe("2026-10-16")
    expect(parseDate("16 באוקטובר 2026", "he-IL")).toBe("2026-10-16")
    expect(parseDate("16 d’octubre del 2026", "ca-ES")).toBe("2026-10-16")
    expect(parseDate("16 d'octubre del 2026", "ca-ES")).toBe("2026-10-16")
    expect(parseDate("5 ژانویهٔ 2026", "fa-IR")).toBe("2026-01-05")
  })

  test("reads a month written with its number, and the words around the numbers", () => {
    expect(parseDate("16 tháng 10, 2026", "vi-VN")).toBe("2026-10-16")
    expect(parseDate("2026 оны 10-р сарын 16", "mn-MN")).toBe("2026-10-16")
    expect(parseDate("2026(e)ko urriaren 16(a)", "eu-ES")).toBe("2026-10-16")
    expect(parseDate("民國115年10月16日", "zh-TW-u-ca-roc")).toBe("2026-10-16")
  })

  test("reads the locale's full date, with its weekday", () => {
    expect(parseDate("fredag den 16. oktober 2026", "da-DK")).toBe("2026-10-16")
    expect(parseDate("sexta-feira, 16 de outubro de 2026", "pt-BR")).toBe(
      "2026-10-16"
    )
    expect(parseDate("e premte, 16 tetor 2026", "sq-AL")).toBe("2026-10-16")
    expect(parseDate("2026年10月16日金曜日", "ja-JP")).toBe("2026-10-16")
    expect(parseDate("2026年10月16日星期五", "zh-CN")).toBe("2026-10-16")
  })

  test("reads a year written in an era", () => {
    const japanese = "ja-JP-u-ca-japanese"
    expect(parseDate("令和8年10月16日", japanese)).toBe("2026-10-16")
    expect(parseDate("令和8年10月16日金曜日", japanese)).toBe("2026-10-16")
    expect(parseDate("R8/10/16", japanese)).toBe("2026-10-16")
    expect(parseDate("H11/7/4", japanese)).toBe("1999-07-04")
    expect(parseDate("令和元年5月1日", japanese)).toBe("2019-05-01")
    expect(parseDate("民國115/10/16", "zh-TW-u-ca-roc")).toBe("2026-10-16")
    expect(parseDate("民國88/7/4", "zh-TW-u-ca-roc")).toBe("1999-07-04")
    expect(parseDate("10/16/2569 BE", "en-US-u-ca-buddhist")).toBe("2026-10-16")
    expect(
      parseDate("16.10.69 BE", "de-u-ca-buddhist", {
        referenceDate: "2026-01-01",
      })
    ).toBe("2026-10-16")
  })

  test("doesn't read a date outside the era it's written in", () => {
    const japanese = "ja-JP-u-ca-japanese"
    expect(parseDate("平成31年5月1日", japanese)).toBeUndefined()
    expect(parseDate("S64/1/8", japanese)).toBeUndefined()
    expect(parseDate("民國前1/1/1", "zh-TW-u-ca-roc")).toBeUndefined()
  })

  test("reads a pasted label with its weekday", () => {
    expect(parseDate("Friday, October 16, 2026", "en-US")).toBe("2026-10-16")
  })

  test("reads the words some locales write between numbers", () => {
    expect(parseDate("2026年10月16日", "ja")).toBe("2026-10-16")
    expect(parseDate("2026년 10월 16일", "ko")).toBe("2026-10-16")
  })

  test("reads years in the calendar the locale writes them in", () => {
    const shown = formatDate("2026-10-16", "th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    expect(parseDate(shown, "th-TH")).toBe("2026-10-16")
    expect(parseDate("16/10/2569", "th-TH")).toBe("2026-10-16")
    expect(
      parseDate("16/10/69", "th-TH", { referenceDate: "2026-01-01" })
    ).toBe("2026-10-16")
    expect(parseDate("16/10", "th-TH", { referenceDate: "2026-01-01" })).toBe(
      "2026-10-16"
    )
    expect(parseDate("10/16/2569", "en-US-u-ca-buddhist")).toBe("2026-10-16")
    expect(parseDate("115/10/16", "zh-TW-u-ca-roc")).toBe("2026-10-16")
    expect(parseDate("2026/10/16", "ja-JP-u-ca-japanese")).toBe("2026-10-16")
  })

  test("reads the locale's own digits", () => {
    expect(parseDate("١٦/١٠/٢٠٢٦", "ar-EG")).toBe("2026-10-16")
  })

  test("text that isn't a real date gives undefined", () => {
    expect(parseDate("", "en-US")).toBeUndefined()
    expect(parseDate("02/30/2026", "en-US")).toBeUndefined()
    expect(parseDate("13/13/2026", "en-US")).toBeUndefined()
    expect(parseDate("Octber 16", "en-US")).toBeUndefined()
    expect(parseDate("tomorrow", "en-US")).toBeUndefined()
    expect(parseDate("1/2/3/4", "en-US")).toBeUndefined()
    expect(parseDate("2026", "en-US")).toBeUndefined()
  })
})
