# Content Organization Strategy - Koutoubi AI

## Overview

This document outlines the refined content organization strategy for flashcards, quiz, and mindmaps in Koutoubi AI.

## Core Principles

### 1. **Hybrid Approach**
- **Study Materials** (Flashcards & Quiz): Chapter-level organization
- **Overview Materials** (Mindmaps): Course-level with optional chapter views
- **Flexibility**: Users can switch between chapter and course modes

### 2. **Content Hierarchy**

```
Course (e.g., "secondaire1-2eme-mathematiques")
├── Chapter 1: Introduction
│   ├── Flashcards (20-30 cards)
│   └── Quiz (10-15 questions)
├── Chapter 2: Algebra
│   ├── Flashcards (25-35 cards)
│   └── Quiz (15-20 questions)
├── Chapter 3: Geometry
│   ├── Flashcards (30-40 cards)
│   └── Quiz (20 questions)
└── Course Mindmap (overview of all chapters)
```

## Implementation Details

### Database Schema

#### Chapter Model Enhanced
```python
class Chapter:
    id: str                    # Unique identifier
    numero: int               # Chapter number
    title: str                # Chapter title
    course_id: str            # Format: "niveau-annee-matiere"
    order: int                # Display order
    prerequisites: List[str]  # Prerequisite chapter IDs
    description: str          # Brief description
```

#### Mindmap Model Enhanced
```python
class Mindmap:
    id: str
    pdf_id: str              # Course identifier
    chapter_id: str | None   # Optional for chapter-specific
    level: str               # 'course' or 'chapter'
    content: str             # JSON mindmap data
```

### API Endpoints

#### Chapter-Level (Existing)
- `GET /api/v1/chapters/{chapter_id}/flashcards`
- `GET /api/v1/chapters/{chapter_id}/quiz`
- `POST /api/v1/chapters/{chapter_id}/mindmap/generate`

#### Course-Level (New)
- `GET /api/v1/courses/{course_id}/flashcards`
- `GET /api/v1/courses/{course_id}/quiz`
- `GET /api/v1/courses/{course_id}/chapters`
- `POST /api/v1/courses/{course_id}/mindmap/generate`

### UI Components

#### Study Mode Selector
Allows users to switch between:
- **Chapter Mode**: Focus on current chapter
- **Course Mode**: Review entire course
- **Smart Mode**: AI-powered adaptive review (Premium)

#### Content Hierarchy Display
Shows clear distinction:
- Flashcards: "Chapter-based" badge
- Quiz: "Chapter-based" badge
- Mindmap: "Course-wide" badge

## User Flows

### 1. **New Student Flow**
1. Views course mindmap for overview
2. Studies chapter 1 flashcards
3. Takes chapter 1 quiz
4. Proceeds to chapter 2
5. Reviews all chapters before exam

### 2. **Review Flow**
1. Selects "Course Mode"
2. Reviews mixed flashcards from all chapters
3. Takes comprehensive quiz
4. Views course mindmap for connections

### 3. **Teacher Flow**
1. Creates chapter-specific content
2. Can view aggregate statistics
3. Shares course-level or chapter-level materials

## Benefits

### For Students
- **Progressive Learning**: Start small with chapters
- **Comprehensive Review**: Course mode for exams
- **Visual Overview**: Mindmaps show connections
- **Flexible Study**: Choose appropriate level

### For Teachers
- **Granular Control**: Manage content by chapter
- **Progress Tracking**: See detailed analytics
- **Content Sharing**: Share at appropriate level

### For the Platform
- **Scalability**: Efficient caching at chapter level
- **Flexibility**: Easy to add new content types
- **Performance**: Optimized queries for each level

## Future Enhancements

### Phase 2: Multi-Chapter Selection
- Select specific chapters for review
- Custom study sessions
- Progress-based recommendations

### Phase 3: Smart Review
- AI analyzes performance
- Recommends focus areas
- Adaptive difficulty

### Phase 4: Learning Paths
- Prerequisites enforcement
- Guided progression
- Mastery tracking

## Migration Plan

1. **Database Migration**: Add new fields to existing models
2. **API Implementation**: Add aggregation endpoints
3. **UI Updates**: Add mode selectors and badges
4. **User Education**: In-app tooltips and guides

## Conclusion

This hybrid approach balances the need for focused study (chapter-level) with comprehensive review (course-level), while maintaining flexibility for different learning styles and use cases.