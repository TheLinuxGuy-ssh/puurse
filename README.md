# Purrse

Money tracking with a cat that has opinions.

Purrse is a privacy first personal finance tracker made with vanilla HTML, CSS, and JavaScript. Data stays in your browser under `purrse_v1`. There is no backend, account, analytics, or external dependency.

The interface uses a light neo brutalist visual language with warm paper tones, thick ink borders, offset shadows, and playful accent colors. The visual tone is intentionally lighter than the subject matter.

## Run locally

Because ES modules do not load from `file://`, run `python3 -m http.server` in this folder and open `http://localhost:8000`.

## Included

- Local accounts and transactions for expenses, income, and transfers
- Searchable activity list, dashboard, statistics, and account management
- Safe calculator expressions with integer minor unit storage
- JSON backup export and sample data
- Responsive mobile and desktop layout with a strict Content Security Policy

## Privacy and safety

Nothing leaves the device unless you export it. Amounts are stored as integer hundredths, and dates are local calendar strings to avoid timezone errors. The current build does not offer encryption or a PIN, so device access should be protected by the operating system.

## How I used GitHub Copilot

Copilot was used to turn the product brief into a small static app, suggest implementation structure, and help check edge cases around money parsing and local dates. All behavior and code were reviewed and adjusted for this project.

## Inspired by

The concept is inspired by cat themed expense trackers. Purrse uses original names, artwork, code, and copy.

## License

MIT
