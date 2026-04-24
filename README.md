# Lunenburg Override Projection

Small static calculator for projecting the long-run effect of a Massachusetts Proposition 2.5 override on a single property's tax burden.

## What it does

- Starts from the current, Tier 1, and Tier 2 tax rates for the property.
- Converts those tax rates into dollar taxes using assessed value.
- Grows each scenario by the annual levy growth rate, defaulting to 2.5%.
- Optionally grows the property's assessed value each year as a separate sensitivity assumption.
- Estimates what those yearly override amounts could grow to if invested instead, using a conservative annual return assumption.
- Optionally projects full tax totals if you enter your current annual bill or assessed value.
- Shows annual and cumulative impact over a configurable number of fiscal years.

## Assumption built into the model

This app isolates the override effect by assuming:

`future tax under a scenario = starting tax from that scenario's rate × (1 + annual levy growth) ^ years elapsed × (1 + annual assessed value growth) ^ years elapsed`

The override burden for a given year is the difference between the override scenario tax and the no-override tax in that same year. That follows the Massachusetts rule that a passed override becomes part of the levy-limit base and can then grow in future years.

## Run it

Open [index.html](/Users/imc422/Developer/web/override-calculator/index.html) in a browser.

You can also serve the folder locally with a simple static file server if you prefer.

## GitHub Pages

This repo is set up for GitHub Pages deployment using the workflow at
[.github/workflows/deploy-pages.yml](/Users/imc422/Developer/web/override-calculator/.github/workflows/deploy-pages.yml).

### Publish it

1. Create a GitHub repository and push this folder to the `main` branch.
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Source`, choose `GitHub Actions`.
4. Push to `main` and let the `Deploy static site to GitHub Pages` workflow run.

### Connect your domain

1. In `Settings` -> `Pages`, enter your custom domain.
2. Add the DNS records GitHub Pages requires for your domain.
3. Enable `Enforce HTTPS` after the certificate is issued.
4. Verify the domain in GitHub for extra protection against domain takeover.

GitHub's current docs:

- [GitHub Pages overview](https://docs.github.com/pages)
- [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Verifying your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)

If you want the custom domain stored in the repo too, add a root-level `CNAME` file containing your domain name once you've chosen exactly which hostname to use.
