# Specification 014 — Portfolio-ready English documentation

## Status

Ready for publication in the public portfolio repository.

## Objective

Make CreditScope immediately understandable to an English-speaking recruiter or hiring manager without duplicating the codebase or creating a second repository.

## Product decisions

| Area | Decision |
| --- | --- |
| Public documentation language | English is canonical for the repository landing page and concise technical documents. |
| Historical Polish documentation | Keep the original Polish planning notes and specifications alongside the concise English public documents; do not duplicate the codebase. |
| Repository structure | Keep one repository and one source tree. Do not maintain an `en/` copy of the application. |
| README | Replace the root `README.md` with a concise English, portfolio-first document. |
| Public app locale | Use English as the first-visit default while keeping `PL | EN` visible and persisting the visitor's choice. |
| Long-form documentation | Add focused English documents for architecture, methodology and setup under `docs/`. |
| Screenshots | Reserve a `docs/assets/` location for reviewed screenshots or GIFs; do not add fabricated assets. |

## Files to add or change

- `README.md` — English project overview, features, stack, limitations, local run and documentation links.
- `docs/ARCHITECTURE.md` — component and data-flow overview.
- `docs/METHODOLOGY.md` — concise English explanation of the financial model and its limits.
- `docs/SETUP.md` — reproducible installation and optional Supabase configuration.
- `.env.example` — safe template for optional client-side Supabase variables.
- `docs/specs/014-portfolio-ready-english-documentation.md` — this decision record.
- `src/i18n/config.ts` — English first-visit default, with saved choice taking precedence.

## README acceptance criteria

- States that the product is an educational loan simulator, not a lender or financial adviser.
- Names implemented features rather than presenting them as future plans.
- Lists the main technologies and quality commands.
- Gives a recruiter a direct route to architecture, methodology and setup documents.
- Includes no secrets, production keys, invented demo link or fabricated screenshots.
- Provides a safe environment-variable template without real credentials.

## Validation

1. Review links from the root README as relative repository links.
2. Verify that a first visit uses English and that an explicit `PL` choice remains persistent.
3. Run tests, linting and a production build.
4. Confirm that no separate code copy or extra repository was published.

## References

- [GitHub Docs — About README files](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [GitHub Docs — Relative links and image paths](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes#relative-links-and-image-paths)
