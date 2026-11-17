"""Copy the page titles and descriptions that used to be written into each page's code."""

from django.db import migrations

PAGES = [
    ("/", "RoamBeyond | Tour packages across India from Delhi", ""),  # description: site settings
    ("/about", "About us", "RoamBeyond is a Delhi-based travel agency planning tour packages across India for solo travellers, couples, families, friends and corporate groups."),
    ("/contact", "Contact us", "Call, WhatsApp, email or visit RoamBeyond in New Delhi. Send us a message and our team calls you back."),
    ("/packages", "Tour packages across India", "Browse tour packages to Kashmir, Kerala, Rajasthan, Ladakh, Himachal, Goa and more. Filter by destination, trip type, duration and budget, then enquire for a call-back."),
    ("/destinations", "Destinations in India", "Explore the places we plan trips to: Kashmir, Kerala, Rajasthan, Ladakh, Himachal Pradesh, Goa, Uttarakhand, the Andaman Islands and the Golden Triangle."),
    ("/plan-my-trip", "Plan my trip", "Tell us where you want to go, who is travelling and your budget. Our team designs a custom itinerary and calls you back. No payment needed."),
    ("/thank-you", "Thank you", "We have received your enquiry and will call you back shortly."),
    ("/credits", "Photo credits", "Credits and licences for the photographs used on this website."),
    ("/privacy", "Privacy policy", "How RoamBeyond collects, uses and protects the details you share in enquiry forms."),
    ("/terms", "Terms and conditions", "Terms for using the RoamBeyond website and for enquiries, bookings, payments and cancellations."),
]


def seed(apps, schema_editor):
    PageSeo = apps.get_model("pages", "PageSeo")
    for path, title, description in PAGES:
        PageSeo.objects.get_or_create(path=path, defaults={"title": title, "description": description})


class Migration(migrations.Migration):
    dependencies = [("pages", "0005_page_seo")]

    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
