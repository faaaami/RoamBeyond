from apps.pages import layout
from apps.pages.models import AboutPage, HomePage, LegalPage, OtherPages, SiteSettings


def test_every_layout_column_exists_on_its_model():
    pairs = [
        (SiteSettings, layout.SITE_SETTINGS),
        (HomePage, layout.HOME_PAGE),
        (AboutPage, layout.ABOUT_PAGE),
        (OtherPages, layout.OTHER_PAGES),
        (LegalPage, layout.LEGAL_PAGE),
    ]
    for model, spec in pairs:
        names = {f.name for f in model._meta.get_fields()}
        missing = set(layout.columns(spec)) - names
        assert not missing, f"{model.__name__} lacks {missing}"


def test_flatten_is_the_inverse_of_nest():
    page = HomePage(hero_eyebrow="Hi", how_title="Steps", marquee=["Leh"])
    nested = layout.nest(page, layout.HOME_PAGE)
    flat = layout.flatten(nested, layout.HOME_PAGE)
    assert flat["hero_eyebrow"] == "Hi"
    assert flat["how_title"] == "Steps"
    assert flat["marquee"] == ["Leh"]
