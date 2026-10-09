"""Iran province catalogue; stable identifiers keep language changes out of stored data.

Names checked against the PCGN Iran Toponymic Factfile (2026):
https://assets.publishing.service.gov.uk/media/68664e54adfe29730ea3a9c7/Iran_Toponymic_Factfile.pdf
"""

from pydantic import BaseModel


class Province(BaseModel):
    id: str
    fa: str
    en: str


PROVINCES = tuple(
    Province(id=identifier, fa=fa, en=en)
    for identifier, fa, en in (
        ("alborz", "البرز", "Alborz"),
        ("ardabil", "اردبیل", "Ardabil"),
        ("east_azerbaijan", "آذربایجان شرقی", "East Azerbaijan"),
        ("west_azerbaijan", "آذربایجان غربی", "West Azerbaijan"),
        ("bushehr", "بوشهر", "Bushehr"),
        ("chaharmahal_bakhtiari", "چهارمحال و بختیاری", "Chaharmahal and Bakhtiari"),
        ("isfahan", "اصفهان", "Isfahan"),
        ("fars", "فارس", "Fars"),
        ("gilan", "گیلان", "Gilan"),
        ("golestan", "گلستان", "Golestan"),
        ("hamadan", "همدان", "Hamadan"),
        ("hormozgan", "هرمزگان", "Hormozgan"),
        ("ilam", "ایلام", "Ilam"),
        ("kerman", "کرمان", "Kerman"),
        ("kermanshah", "کرمانشاه", "Kermanshah"),
        ("south_khorasan", "خراسان جنوبی", "South Khorasan"),
        ("razavi_khorasan", "خراسان رضوی", "Razavi Khorasan"),
        ("north_khorasan", "خراسان شمالی", "North Khorasan"),
        ("khuzestan", "خوزستان", "Khuzestan"),
        ("kohgiluyeh_boyer_ahmad", "کهگیلویه و بویراحمد", "Kohgiluyeh and Boyer-Ahmad"),
        ("kurdistan", "کردستان", "Kurdistan"),
        ("lorestan", "لرستان", "Lorestan"),
        ("markazi", "مرکزی", "Markazi"),
        ("mazandaran", "مازندران", "Mazandaran"),
        ("qazvin", "قزوین", "Qazvin"),
        ("qom", "قم", "Qom"),
        ("semnan", "سمنان", "Semnan"),
        ("sistan_baluchestan", "سیستان و بلوچستان", "Sistan and Baluchestan"),
        ("tehran", "تهران", "Tehran"),
        ("yazd", "یزد", "Yazd"),
        ("zanjan", "زنجان", "Zanjan"),
    )
)


def normalize_province(value: str | None, *, strict: bool = True) -> str | None:
    if not value or not value.strip():
        return None
    normalized = " ".join(
        value.replace("ي", "ی").replace("ك", "ک").replace("\u200c", " ").split()
    ).casefold()
    for province in PROVINCES:
        for name in (province.id, province.fa, province.en):
            if normalized == " ".join(name.replace("\u200c", " ").split()).casefold():
                return province.id
    if not strict:
        return value
    raise ValueError("Select a province from Iran's province list")
