# Scripts

The Apple Health preprocessor has moved to the TypeScript CLI.

## Usage

```bash
npm install
npm run preprocess -- --input /path/to/export.xml --output /path/to/output-dir
```

Or after building:

```bash
npm run build
npx apple-health-preprocess --input export.xml --output ./csv-output
```

## Supported output types

`heart_rate`, `resting_heart_rate`, `walking_heart_rate_average`,
`heart_rate_variability_sdnn`, `oxygen_saturation`, `vo2max`, `step_count`,
`sleep_analysis`, `workouts`

Pass `--types` to limit output, for example:

```bash
npm run preprocess -- --input export.xml --output ./out --types heart_rate,step_count
```

See the [README](../README.md) for Redis configuration and development setup.
