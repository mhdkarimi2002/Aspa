from datetime import date

import jdatetime


def to_jalali(value: date) -> str:
    return jdatetime.date.fromgregorian(date=value).isoformat()


def from_jalali(value: str) -> date:
    normalized = value.translate(
        str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
    ).replace("/", "-")
    parts = normalized.split("-")
    if len(parts) != 3 or len(parts[0]) != 4:
        raise ValueError("Enter a valid Jalali date")
    year, month, day = map(int, parts)
    return jdatetime.date(year, month, day).togregorian()
