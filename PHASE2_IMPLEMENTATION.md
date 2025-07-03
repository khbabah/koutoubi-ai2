# Phase 2 Implementation - Study Mode System

## Overview

Phase 2 implements a flexible study mode system that allows users to switch between chapter-level and course-level study for flashcards and quiz.

## Key Components Added

### 1. **useStudyMode Hook** (`/src/hooks/useStudyMode.ts`)
- Manages study mode state (chapter/course/smart)
- Persists preferences in localStorage
- Syncs with URL parameters
- Provides helper methods for mode checking

### 2. **StudyModeSelector Component** (`/src/components/StudyModeSelector.tsx`)
- Dropdown UI for switching between modes
- Shows current mode with icon
- Displays mode descriptions
- Indicates premium features

### 3. **ContentHierarchy Component** (`/src/components/ContentHierarchy.tsx`)
- Visual representation of content organization
- Shows which features are chapter vs course level
- Provides helpful tooltips
- Breadcrumb navigation

### 4. **Enhanced Components**
- **FlashcardsViewEnhanced**: Supports both chapter and course modes
- **QuizViewEnhanced**: Supports both chapter and course modes
- Both components fetch appropriate data based on selected mode

## User Experience

### Chapter Mode (Default)
- Focused study on current chapter
- Progress tracking enabled
- Spaced repetition for flashcards
- Ideal for learning new material

### Course Mode
- Review all chapters at once
- Mixed questions/flashcards
- Great for exam preparation
- Shows chapter source for each item

### Smart Mode (Premium - Future)
- AI-powered adaptive learning
- Focus on weak areas
- Personalized review schedule

## API Integration

### New Endpoints Used
- `GET /api/v1/courses/{course_id}/flashcards`
- `GET /api/v1/courses/{course_id}/quiz`
- `GET /api/v1/courses/{course_id}/chapters`

### Data Flow
1. User selects study mode
2. Component fetches appropriate data
3. UI updates to show chapter badges in course mode
4. Progress saved only in chapter mode

## Visual Indicators

- **Mode Badge**: Shows active mode in selector
- **Chapter Badge**: In course mode, shows source chapter
- **Info Messages**: Explains mode differences
- **Progress Bar**: Adapts to show overall progress

## Implementation Details

### State Management
```typescript
const flashcardsMode = useStudyMode({ feature: 'flashcards' });
const quizMode = useStudyMode({ feature: 'quiz' });
const mindmapMode = useStudyMode({ feature: 'mindmap', defaultMode: 'course' });
```

### Mode Persistence
- Saved per feature type
- Restored on page reload
- Synced with URL for sharing

### Performance Optimizations
- Components remain mounted, just hidden
- Data cached separately per mode
- Lazy loading for course data

## Next Steps

### Phase 3: Smart Review Mode
- Implement AI-based question selection
- Track performance across chapters
- Generate personalized study plans

### Phase 4: Advanced Features
- Multi-chapter selection
- Custom study sessions
- Export/import study sets
- Collaborative study groups

## Testing Checklist

- [ ] Switch between modes preserves data
- [ ] Progress saves correctly in chapter mode
- [ ] Course mode shows all chapters
- [ ] Mode preference persists on reload
- [ ] URL parameters work correctly
- [ ] Mobile responsive design
- [ ] Performance with large datasets