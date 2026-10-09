import pytest

from app.modules.users.provinces import PROVINCES, normalize_province
from app.modules.users.schemas import UserUpdate


def test_bilingual_catalogue_normalizes_supported_names_and_rejects_free_text():
    assert len(PROVINCES) == 31
    assert len({p.id for p in PROVINCES}) == 31
    for province in PROVINCES:
        assert province.fa and province.en
        for value in (province.id, province.fa, province.en.upper()):
            assert UserUpdate(province=value).province == province.id
    assert normalize_province("  تهران  ") == "tehran"
    assert normalize_province("گیلان".replace("ی", "ي")) == "gilan"
    assert UserUpdate(province="").province is None
    assert UserUpdate(province=None).province is None
    assert normalize_province("Old location", strict=False) == "Old location"
    with pytest.raises(ValueError):
        UserUpdate(province="Paris")
