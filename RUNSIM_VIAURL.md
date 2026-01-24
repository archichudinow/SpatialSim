# Running Simulations via URL

This guide explains how to create direct links to run specific simulations in the SpatialSim application.

## URL Structure

```
https://spatial-lens-simulation.vercel.app/{project_id}?option={option_id}&scenario={scenario_id}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | UUID | **Yes** | The project UUID (in URL path) |
| `option` | UUID | No | The project option UUID (query parameter) |
| `scenario` | UUID | No | The scenario UUID (query parameter) |

## How It Works

The application uses the following priority for selecting options and scenarios:

1. **Option Selection Priority:**
   - URL parameter (`?option=...`) if provided
   - Default option (`is_default=true`) if no URL parameter
   - First option if no default specified

2. **Scenario Selection Priority:**
   - URL parameter (`?scenario=...`) if provided
   - First scenario of the selected option

## URL Examples

### Example 1: Specific Project, Option, and Scenario
```
https://spatial-lens-simulation.vercel.app/0fb68333-29ca-40bd-90d7-f61eda898922?option=abc12345-1234-1234-1234-123456789abc&scenario=def67890-5678-5678-5678-567890abcdef
```
**Result:** Loads project with the specific option and scenario.

### Example 2: Specific Project and Option (First Scenario)
```
https://spatial-lens-simulation.vercel.app/0fb68333-29ca-40bd-90d7-f61eda898922?option=abc12345-1234-1234-1234-123456789abc
```
**Result:** Loads project with the specific option and its first scenario.

### Example 3: Project Only (Default/First Option and Scenario)
```
https://spatial-lens-simulation.vercel.app/0fb68333-29ca-40bd-90d7-f61eda898922
```
**Result:** Loads project with default option (or first option) and its first scenario.

### Example 4: Specific Scenario Only
```
https://spatial-lens-simulation.vercel.app/0fb68333-29ca-40bd-90d7-f61eda898922?scenario=def67890-5678-5678-5678-567890abcdef
```
**Result:** Loads project with default option and the specified scenario (if it belongs to that option).

## Getting IDs from Database

To create simulation links, you need to retrieve IDs from your Supabase database:

### Get Project ID
```sql
SELECT id, name, status 
FROM projects 
WHERE status IN ('development', 'released');
```

### Get Options for a Project
```sql
SELECT id, name, project_id, is_default 
FROM project_options 
WHERE project_id = 'YOUR_PROJECT_ID' 
  AND is_archived = false;
```

### Get Scenarios for an Option
```sql
SELECT id, name, option_id 
FROM scenarios 
WHERE option_id = 'YOUR_OPTION_ID' 
  AND is_archived = false;
```

### Get All Data at Once
```sql
SELECT 
  p.id as project_id,
  p.name as project_name,
  po.id as option_id,
  po.name as option_name,
  po.is_default as is_default_option,
  s.id as scenario_id,
  s.name as scenario_name
FROM projects p
LEFT JOIN project_options po ON po.project_id = p.id AND po.is_archived = false
LEFT JOIN scenarios s ON s.option_id = po.id AND s.is_archived = false
WHERE p.status IN ('development', 'released')
ORDER BY p.name, po.created_at, s.created_at;
```

## Link Generation Template

### JavaScript/TypeScript
```typescript
function generateSimulationLink(
  projectId: string,
  optionId?: string,
  scenarioId?: string
): string {
  const baseUrl = 'https://spatial-lens-simulation.vercel.app';
  let url = `${baseUrl}/${projectId}`;
  
  const params = new URLSearchParams();
  if (optionId) params.append('option', optionId);
  if (scenarioId) params.append('scenario', scenarioId);
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

// Examples:
generateSimulationLink('project-uuid');
// => https://spatial-lens-simulation.vercel.app/project-uuid

generateSimulationLink('project-uuid', 'option-uuid');
// => https://spatial-lens-simulation.vercel.app/project-uuid?option=option-uuid

generateSimulationLink('project-uuid', 'option-uuid', 'scenario-uuid');
// => https://spatial-lens-simulation.vercel.app/project-uuid?option=option-uuid&scenario=scenario-uuid
```

### Python
```python
from urllib.parse import urlencode

def generate_simulation_link(project_id: str, option_id: str = None, scenario_id: str = None) -> str:
    base_url = 'https://spatial-lens-simulation.vercel.app'
    url = f'{base_url}/{project_id}'
    
    params = {}
    if option_id:
        params['option'] = option_id
    if scenario_id:
        params['scenario'] = scenario_id
    
    if params:
        url += f'?{urlencode(params)}'
    
    return url

# Examples:
generate_simulation_link('project-uuid')
# => https://spatial-lens-simulation.vercel.app/project-uuid

generate_simulation_link('project-uuid', option_id='option-uuid')
# => https://spatial-lens-simulation.vercel.app/project-uuid?option=option-uuid

generate_simulation_link('project-uuid', option_id='option-uuid', scenario_id='scenario-uuid')
# => https://spatial-lens-simulation.vercel.app/project-uuid?option=option-uuid&scenario=scenario-uuid
```

## Validation Rules

1. **Project ID:**
   - Must be a valid UUID
   - Project must exist in database
   - Project status must be 'development' or 'released' (not 'archived')

2. **Option ID:**
   - Must be a valid UUID
   - Must belong to the specified project
   - Must not be archived (`is_archived = false`)

3. **Scenario ID:**
   - Must be a valid UUID
   - Must belong to the selected option
   - Must not be archived (`is_archived = false`)

## Error Handling

If invalid IDs are provided:
- **Invalid project ID**: User sees error page "Error Loading Project"
- **Invalid option ID**: Falls back to default/first option
- **Invalid scenario ID**: Falls back to first scenario of selected option

## Use Cases

### Admin Panel Integration
Create buttons/links in your admin panel for each scenario:
```html
<a href="https://spatial-lens-simulation.vercel.app/0fb68333-29ca-40bd-90d7-f61eda898922?option=abc123&scenario=def456">
  Run Simulation: Busy Office Day
</a>
```

### Email Notifications
Send direct simulation links to testers:
```
Hi Team,

Please test the following scenarios:
- Scenario A: https://spatial-lens-simulation.vercel.app/project-uuid?option=opt1&scenario=sc1
- Scenario B: https://spatial-lens-simulation.vercel.app/project-uuid?option=opt1&scenario=sc2
```

### QR Codes for VR Testing
Generate QR codes with specific simulation URLs for easy VR headset access.

## Notes

- Links can be bookmarked
- Links can be shared
- No authentication required (uses Supabase anonymous key)
- All IDs are UUIDs in format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Query parameters are case-sensitive
- Multiple parameter formats work: `?option=x&scenario=y` or `?scenario=y&option=x`

## Support

For questions about simulation links or the database schema, refer to `SUPABASE_USAGE.md`.
