# Feature Flags Package

A comprehensive feature flag system supporting both database-backed custom implementation and GrowthBook integration for A/B testing and gradual rollouts.

## Features

- ✅ **Multiple Providers**: Database (PostgreSQL) and GrowthBook support
- ✅ **User Targeting**: Role-based, plan-based, and custom attribute targeting
- ✅ **Rollout Control**: Percentage-based gradual rollouts
- ✅ **Analytics**: Built-in event tracking and usage analytics
- ✅ **Caching**: Intelligent caching for performance
- ✅ **React Integration**: Hooks and components for frontend
- ✅ **TypeScript**: Full type safety

## Installation

The package is already included in the monorepo workspace.

```bash
# Install dependencies for the package
cd packages/feature-flags
pnpm install
```

## Configuration

### Environment Variables

```bash
# Feature Flag Provider (database or growthbook)
FEATURE_FLAG_PROVIDER=database

# Database Provider
DATABASE_URL=postgresql://user:pass@localhost:5432/deepwebai

# GrowthBook Provider (if using GrowthBook)
GROWTHBOOK_API_KEY=your_api_key
GROWTHBOOK_CLIENT_KEY=your_client_key
GROWTHBOOK_API_URL=https://cdn.growthbook.io

# General Config
FEATURE_FLAG_CACHE_TIMEOUT=300
```

## Backend Usage

### Service Initialization

```typescript
import { featureFlagService } from './modules/feature-flags/feature-flags.service';

// Initialize in your server startup
await featureFlagService.initialize();
```

### Checking Feature Flags

```typescript
import { featureFlagService } from './modules/feature-flags/feature-flags.service';

// Check if a feature is enabled for a user
const canUseNewUI = await featureFlagService.isFeatureEnabled(
  'new-chat-ui',
  userId,
  { plan: 'premium', role: 'admin' }
);

// Get feature value (for non-boolean flags with GrowthBook)
const theme = await featureFlagService.getFeatureValue(
  'default-theme',
  userId,
  'light'
);

// Convenience methods
const canUsePremium = await featureFlagService.canUsePremiumModels(userId);
```

### API Endpoints

The system automatically provides REST endpoints:

```bash
# Get all feature flags for a user
GET /api/feature-flags?userId=123&plan=premium&role=admin

# Check specific feature flag
GET /api/feature-flags/new-chat-ui?userId=123

# Track feature usage event
POST /api/feature-flags/track
{
  "eventName": "feature_used",
  "userId": "123",
  "properties": { "feature": "new-chat-ui" }
}
```

## Frontend Usage

### React Hooks

```tsx
import { useFeatureFlag, useFeatureFlags } from './hooks/useFeatureFlags';

function MyComponent() {
  // Single feature flag
  const { isEnabled, track } = useFeatureFlag('new-chat-ui', {
    userId: currentUser.id,
    userAttributes: { plan: currentUser.plan }
  });

  // All feature flags
  const { featureFlags, isFeatureEnabled } = useFeatureFlags({
    userId: currentUser.id,
    userAttributes: { plan: currentUser.plan }
  });

  const handleButtonClick = () => {
    track({ action: 'button_clicked' }); // Track usage
    // ... rest of the logic
  };

  return (
    <div>
      {isEnabled && <NewChatInterface />}
      {isFeatureEnabled('premium-models') && <PremiumSection />}
    </div>
  );
}
```

### React Components

```tsx
import { FeatureFlag, ConditionalFeature } from './components/FeatureFlag';

function App() {
  return (
    <div>
      {/* Conditional rendering */}
      <FeatureFlag 
        flag="new-chat-ui" 
        userId={currentUser.id}
        fallback={<OldChatInterface />}
      >
        <NewChatInterface />
      </FeatureFlag>

      {/* Alternative syntax */}
      <ConditionalFeature
        flag="premium-models"
        userId={currentUser.id}
        enabled={<PremiumFeatures />}
        disabled={<UpgradePrompt />}
      />

      {/* Predefined components */}
      <NewChatUIFeature userId={currentUser.id}>
        <AdvancedChatFeatures />
      </NewChatUIFeature>
    </div>
  );
}
```

### Higher-Order Component

```tsx
import { withFeatureFlag } from './components/FeatureFlag';

const PremiumComponent = ({ data }) => (
  <div>Premium content: {data}</div>
);

const FeatureFlaggedComponent = withFeatureFlag(
  PremiumComponent,
  'premium-features',
  FreeVersionComponent // fallback
);
```

## Database Schema

The system uses PostgreSQL with these tables:

- `feature_flags` - Flag definitions and configurations
- `user_feature_flags` - User-specific overrides
- `feature_flag_analytics` - Usage tracking and analytics

Key features:
- Percentage-based rollouts with consistent user hashing
- Time-based flag activation (start/end dates)
- Environment-specific flags
- Built-in analytics and statistics

## Creating Feature Flags

### Database Provider

```sql
-- Create a new feature flag
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage, environment)
VALUES ('new-feature', 'Description of new feature', true, 50, 'production');

-- Create user override
INSERT INTO user_feature_flags (user_id, feature_flag_id, is_enabled, reason)
SELECT '123e4567-e89b-12d3-a456-426614174000', id, true, 'Beta tester'
FROM feature_flags WHERE name = 'new-feature';
```

### GrowthBook Provider

Configure flags through the GrowthBook dashboard with targeting rules and experiments.

## Best Practices

1. **Naming Convention**: Use kebab-case (e.g., `new-chat-ui`, `premium-models`)
2. **Gradual Rollouts**: Start with low percentages and increase gradually
3. **User Attributes**: Include relevant user context for targeting
4. **Analytics**: Track feature usage to measure success
5. **Cleanup**: Remove old flags after full rollout
6. **Testing**: Test both enabled/disabled states

## Predefined Feature Flags

The system includes these predefined flags:

- `new-chat-ui` - New chat interface
- `ai-streaming` - Real-time AI response streaming
- `premium-models` - Access to premium AI models
- `file-upload` - File upload functionality
- `realtime-collaboration` - Real-time collaboration features
- `advanced-analytics` - Advanced analytics dashboard
- `beta-features` - Beta feature access
- `custom-themes` - Custom theme support

## Performance

- **Caching**: Results cached for 5 minutes by default
- **Database**: Optimized queries with proper indexing
- **Frontend**: Efficient React hooks with minimal re-renders
- **Analytics**: Async event tracking doesn't block requests

## Monitoring

- Health check endpoint: `/api/feature-flags/health`
- Built-in analytics and statistics
- Integration with existing monitoring systems
- Sentry error tracking for flag evaluation failures
