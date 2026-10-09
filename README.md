# StatHub

A responsive, browser-based statistics workspace for university students. Built with HTML, CSS, vanilla JavaScript, Plotly.js, Supabase Auth, and Supabase Postgres. It can be hosted as a static site on GitHub Pages.

## Features

- **Descriptive statistics:** count, mean, median, mode, sample/population variance and standard deviation, quartiles, range, IQR, histogram.
- **Probability:** binomial PMF and P(X = x), P(X ≤ x), P(X ≥ x), expectation, variance, standard deviation.
- **Sampling distributions:** simulated sample means from a normal population, empirical/theoretical standard error, histogram.
- **Inferential statistics:** one-sample two-sided Student t-test, p-value, confidence interval, decision at chosen alpha.
- **Regression analysis:** simple least-squares regression, intercept, slope, Pearson correlation, R², residual standard error, fitted values/residuals and scatterplot.
- **Demography:** annualized population growth, crude birth/death rates, natural increase, optional age-group chart and dependency ratio.
- Guest mode works without a database. Supabase email/password sign-up/sign-in and per-user saved analysis are enabled after configuration.
- Responsive layout and interactive Plotly charts.

## Folder structure

```text
StatHub/
├── index.html
├── styles.css
├── app.js
├── README.md
└── supabase/
    └── schema.sql
```

## Run locally in VS Code

1. Extract this folder and open it in VS Code.
2. Install the **Live Server** extension, if needed.
3. Right-click `index.html` → **Open with Live Server**.
4. An internet connection is required to load Plotly.js and Supabase JS from their CDNs. Core calculations run in the browser.

You can also use a local static server. Do not open the file directly as `file://` when testing authentication.

## Configure Supabase

1. Create a project at [Supabase](https://supabase.com/).
2. In **Project Settings → API** (or **Connect**), copy the Project URL and the publishable/anon browser key.
3. Open `app.js` and set:

   ```js
   const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
   const SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_OR_ANON_KEY";
   ```

4. In Supabase **SQL Editor**, run all of `supabase/schema.sql`. This creates `saved_analyses` and enables Row Level Security policies so authenticated users can only access their own rows.
5. In **Authentication → URL Configuration**, add your local URL (for example, `http://127.0.0.1:5500`) and deployed GitHub Pages URL to the allowed redirect URLs. Set the Site URL to the deployed site after deployment.
6. Email confirmation may be enabled by default. If enabled, users must confirm their email before signing in. Configure email provider settings in Supabase if desired.

**Security:** the publishable/anon key is designed for browser use when RLS is configured. Never put a `service_role` or secret key in `app.js`, HTML, a public GitHub repository, or any client-side bundle.

## Deploy to GitHub Pages

1. Create a GitHub repository, e.g. `stathub`.
2. Upload or push the contents of this folder to the repository root. `index.html` must be at the published root.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose your main branch and `/ (root)`, then Save.
5. Wait for the Pages deployment to finish. Your URL will look like `https://YOUR-USERNAME.github.io/stathub/`.
6. Add that URL to Supabase Authentication's allowed redirect URLs and set it as the Site URL.
7. Test guest mode, sign-up, sign-in, and saving an analysis.

## Statistical notes and limitations

- Calculations are educational implementations, not a substitute for validated statistical software in high-stakes work.
- The one-sample t-test assumes independent observations and an approximately normal population for small samples. It is two-sided only in this starter version.
- The sampling simulator assumes a normal population and uses pseudo-random browser sampling.
- Regression currently implements simple linear regression, not multiple regression.
- Demographic rates use current population as denominator. Interpret definitions carefully for a real demographic report.
- This version saves analysis records but does not yet include a saved-results browser, CSV download, file upload, or multiple regression. These are suitable next features.
- If a CDN is unavailable, the chart library may not load; numerical calculations still execute where applicable, but charts need Plotly.js.

## Troubleshooting

- **Sign in button says configure Supabase:** check both constants at the top of `app.js`.
- **Save denied:** run `supabase/schema.sql`, confirm the user is signed in, and check the browser console for RLS errors.
- **Email confirmation loop:** confirm the email and ensure the GitHub Pages URL is listed in Supabase's allowed redirect URLs.
- **Blank charts:** confirm the browser can access `cdn.plot.ly` and check DevTools Console.
