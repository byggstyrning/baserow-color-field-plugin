from setuptools import setup, find_packages

setup(
    name="baserow_color_field",
    version="1.0.0",
    url="https://byggstyrning.se",
    author="Byggstyrning",
    author_email="",
    license="MIT",
    description="A Baserow plugin that adds a Color field type for storing hex colors.",
    long_description="Adds a Color field type to Baserow with a color picker UI, hex input, and swatch display.",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[],
)
