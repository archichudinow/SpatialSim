# Direct Scenario Links Guide

## URL Format

To open the app directly to a specific scenario (skipping the project selection page):

```
https://your-app-domain.com/{PROJECT_ID}?option={OPTION_ID}&scenario={SCENARIO_ID}
```

## Parameters

- **PROJECT_ID**: UUID of the project (e.g., `123e4567-e89b-12d3-a456-426614174000`)
- **option**: ID of the option (query parameter, optional)
- **scenario**: ID of the scenario (query parameter, optional)

## Examples

**Full link with specific option and scenario:**
```
https://your-app.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890?option=OPT001&scenario=SC001
```

**Link with only project (uses default option and first scenario):**
```
https://your-app.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Link with option only (uses first scenario):**
```
https://your-app.com/a1b2c3d4-e5f6-7890-abcd-ef1234567890?option=OPT001
```

## How to Get IDs

1. **Project ID**: UUID visible in browser URL when viewing a project
2. **Option ID**: Check your database `options` table or project configuration
3. **Scenario ID**: Check your database `scenarios` table or project configuration

## Behavior

- If no parameters are specified, the app will:
  - Use the default option (or first option if no default is set)
  - Use the first scenario of that option
- Invalid IDs will fall back to defaults
