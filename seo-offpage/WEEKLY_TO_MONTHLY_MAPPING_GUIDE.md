# Weekly to Monthly Mapping Guide (Google Sheets)

Use this with:

- `WEEKLY_SEO_KPI_ROLLUP_TEMPLATE.csv`
- `MONTHLY_SEO_SCORECARD_TEMPLATE.csv` or `MONTHLY_SEO_SCORECARD_BASELINE.csv`

## Recommended Google Sheets setup

1. Import weekly CSV into a tab named `Weekly`.
2. Import monthly CSV into a tab named `Monthly`.
3. Ensure `Weekly!C:C` contains month labels like `2026-02`.

## Formula patterns (place in Monthly row 2, then fill down)

Assuming:

- `Monthly!A:A` = month label (`2026-02`, `2026-03`, etc.)
- `Weekly!C:C` = month label

### Sum metrics by month

- GBP Calls:
  - `=SUMIFS(Weekly!D:D,Weekly!C:C,$A2)`
- GBP Website Clicks:
  - `=SUMIFS(Weekly!E:E,Weekly!C:C,$A2)`
- GBP Direction Requests:
  - `=SUMIFS(Weekly!F:F,Weekly!C:C,$A2)`
- New Google Reviews:
  - `=SUMIFS(Weekly!G:G,Weekly!C:C,$A2)`
- Referring Domains New:
  - `=SUMIFS(Weekly!I:I,Weekly!C:C,$A2)`
- Backlinks New:
  - `=SUMIFS(Weekly!J:J,Weekly!C:C,$A2)`
- GSC Impressions:
  - `=SUMIFS(Weekly!K:K,Weekly!C:C,$A2)`
- GSC Clicks:
  - `=SUMIFS(Weekly!L:L,Weekly!C:C,$A2)`
- Organic Form Leads:
  - `=SUMIFS(Weekly!M:M,Weekly!C:C,$A2)`
- Organic Phone Leads:
  - `=SUMIFS(Weekly!N:N,Weekly!C:C,$A2)`
- GBP Posts Published:
  - `=SUMIFS(Weekly!O:O,Weekly!C:C,$A2)`
- Citations Submitted:
  - `=SUMIFS(Weekly!P:P,Weekly!C:C,$A2)`
- Citations Live:
  - `=SUMIFS(Weekly!Q:Q,Weekly!C:C,$A2)`
- Outreach Emails Sent:
  - `=SUMIFS(Weekly!R:R,Weekly!C:C,$A2)`
- Outreach Followups Sent:
  - `=SUMIFS(Weekly!S:S,Weekly!C:C,$A2)`
- Links Acquired:
  - `=SUMIFS(Weekly!T:T,Weekly!C:C,$A2)`

### Average metrics by month

- Average Google Rating:
  - `=IFERROR(AVERAGEIFS(Weekly!H:H,Weekly!C:C,$A2),"")`

## Baseline process (first month)

1. Keep `Baseline_Completed=NO` until all month data is imported.
2. Pull initial historical values from GBP and GSC into the first row.
3. Change `Baseline_Completed` to `YES`.
4. Do not overwrite baseline month afterward.

## Practical workflow

- Weekly: enter metrics in `Weekly` tab every Monday.
- Monthly close: verify formulas in `Monthly`, then fill `Wins`, `Issues`, and `Next_Month_Focus` manually.
