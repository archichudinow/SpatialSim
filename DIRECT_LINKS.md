# Direct Scenario Links Guide

## URL Format

To open the app directly to a specific scenario (skipping the project selection page):

```
https://your-app-domain.com/{PROJECT_ID}?option={OPTION_ID}&scenario={SCENARIO_ID}
```

## Parameters

- **PROJECT_ID**: UUID of the project (required, in the URL path)
- **option**: UUID of the option (query parameter, optional)
- **scenario**: UUID of the scenario (query parameter, optional)

## Examples

**Full link with specific option and scenario:**
```
https://your-app.com/babd0223-1cd5-4edb-8641-2dcabfc7355c?option=9e86dfe0-bbfa-403a-a9ec-9b0ed873d737&scenario=f8a43ae9-ce10-4fb6-adcc-54ad2104519d
```

**Link with only project (uses default option and first scenario):**
```
https://your-app.com/babd0223-1cd5-4edb-8641-2dcabfc7355c
```

**Link with option only (uses first scenario of that option):**
```
https://your-app.com/babd0223-1cd5-4edb-8641-2dcabfc7355c?option=9e86dfe0-bbfa-403a-a9ec-9b0ed873d737
```

## How to Get IDs

### From the Database

Query your Supabase database to get IDs:

```sql
-- Get all projects
SELECT id, name FROM projects WHERE is_archived = false;

-- Get options for a specific project
SELECT id, name, is_default FROM options 
WHERE project_id = 'YOUR_PROJECT_ID' AND is_archived = false;

-- Get scenarios for a specific option
SELECT id, name FROM scenarios 
WHERE option_id = 'YOUR_OPTION_ID' AND is_archived = false;
```

### From the Browser

1. **Project ID**: Visible in browser URL when viewing a project
2. **Option/Scenario IDs**: 
   - Open browser DevTools (F12)
   - Select an option/scenario in the UI
   - The IDs will be visible in the URL query parameters

## Behavior

- If no parameters are specified, the app will:
  - Use the default option (identified by `is_default = true`)
  - If no default exists, use the first non-archived option
  - Use the first non-archived scenario of the selected option

- If invalid IDs are provided:
  - Invalid option ID → falls back to default/first option
  - Invalid scenario ID → falls back to first scenario

## Use Cases for External Apps

External applications can generate direct links to specific scenarios:

### 1. Project Management Dashboard
Generate links to specific design options for stakeholder review:
```javascript
const directLink = `https://spatialsim.app/${projectId}?option=${optionId}&scenario=${scenarioId}`;
```

### 2. Email Notifications
Send users directly to a specific scenario:
```
Dear Stakeholder,
Please review the updated design:
https://spatialsim.app/babd0223-1cd5-4edb-8641-2dcabfc7355c?option=9e86dfe0-bbfa-403a-a9ec-9b0ed873d737&scenario=f8a43ae9-ce10-4fb6-adcc-54ad2104519d
```

### 3. QR Codes
Generate QR codes that open specific scenarios for on-site reviews.

### 4. API Integration
Build custom dashboards or tools that link to specific 3D scenarios:
```javascript
// Example: Generate comparison links
const scenarios = [
  { name: "Option A", link: `${baseUrl}?option=${optionA}&scenario=${scenario1}` },
  { name: "Option B", link: `${baseUrl}?option=${optionB}&scenario=${scenario1}` }
];
```

## Technical Notes

- The app uses browser `pushState` and `popstate` events for navigation
- Query parameters are parsed using `URLSearchParams`
- The correct 3D model geometry is loaded based on the option ID
- Each option can have different 3D models, ensuring proper visualization
