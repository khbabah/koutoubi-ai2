# Courses API Documentation

## Overview
The new content API provides access to the actual course PDFs organized by education level, grade, and subject. It replaces the hardcoded "Si Khelladi" data with real mathematics and other subject content.

## Base URL
All endpoints are prefixed with: `/api/v1/content`

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Endpoints

### 1. Get All Courses
**GET** `/api/v1/content/courses`

Returns a list of all available courses from the PDF directory.

#### Query Parameters (optional):
- `niveau`: Filter by education level (fondamental, secondaire1, secondaire2)
- `annee`: Filter by grade (1ere, 2eme, 3eme, etc.)
- `matiere`: Filter by subject (mathematiques, sciences, francais, etc.)

#### Response:
```json
{
  "total": 68,
  "courses": [
    {
      "id": "3",
      "niveau": "secondaire1",
      "niveau_name": "Secondaire 1er cycle",
      "annee": "1ere",
      "matiere": "mathematiques",
      "matiere_name": "Mathématiques",
      "title": "Mathématiques - 1ere Secondaire 1er cycle",
      "pdf_path": "/path/to/pdf",
      "relative_path": "pdf/secondaire1/1ere/mathematiques.pdf",
      "file_size_mb": 74.23,
      "available": true
    }
  ]
}
```

### 2. Get Education Levels
**GET** `/api/v1/content/levels`

Returns the available education levels and their grades.

#### Response:
```json
{
  "levels": [
    {
      "key": "fondamental",
      "name": "Fondamental",
      "grades": ["1ere", "2eme", "3eme", "4eme", "5eme", "6eme"]
    },
    {
      "key": "secondaire1",
      "name": "Secondaire 1er cycle",
      "grades": ["1ere", "2eme", "3eme"]
    },
    {
      "key": "secondaire2",
      "name": "Secondaire 2ème cycle",
      "grades": ["4eme", "5eme", "6eme", "7eme"]
    }
  ]
}
```

### 3. Get Available Subjects
**GET** `/api/v1/content/subjects`

Returns available subjects, optionally filtered by level and grade.

#### Query Parameters (optional):
- `niveau`: Filter by education level
- `annee`: Filter by grade

#### Response:
```json
{
  "subjects": [
    {
      "key": "mathematiques",
      "name": "Mathématiques",
      "course_count": 6
    },
    {
      "key": "sciences",
      "name": "Sciences",
      "course_count": 4
    }
  ]
}
```

### 4. Get Course Information
**GET** `/api/v1/content/course/{niveau}/{annee}/{matiere}`

Get detailed information about a specific course.

#### Path Parameters:
- `niveau`: Education level (e.g., "secondaire1")
- `annee`: Grade (e.g., "1ere")
- `matiere`: Subject (e.g., "mathematiques")

#### Response:
```json
{
  "id": "3",
  "niveau": "secondaire1",
  "niveau_name": "Secondaire 1er cycle",
  "annee": "1ere",
  "matiere": "mathematiques",
  "matiere_name": "Mathématiques",
  "title": "Mathématiques - 1ere Secondaire 1er cycle",
  "pdf_path": "/path/to/pdf",
  "relative_path": "pdf/secondaire1/1ere/mathematiques.pdf",
  "file_size_mb": 74.23,
  "available": true,
  "chapters": [],
  "total_pages": 0
}
```

### 5. Get Course PDF Info
**GET** `/api/v1/content/{niveau}/{annee}/{matiere}/info`

Get PDF metadata for a specific course.

#### Response:
```json
{
  "course": { /* course object */ },
  "pdf_info": {
    "filename": "mathematiques.pdf",
    "total_pages": 250,
    "available_pages": [1, 2, 3, ...],
    "file_size_mb": 74.23
  }
}
```

### 6. Get Course Page Content
**GET** `/api/v1/content/{niveau}/{annee}/{matiere}/page/{page_num}`

Get the content of a specific page from a course PDF.

#### Path Parameters:
- `niveau`: Education level
- `annee`: Grade
- `matiere`: Subject
- `page_num`: Page number (1-based)

#### Response:
```json
{
  "course": {
    "niveau": "secondaire1",
    "annee": "1ere",
    "matiere": "mathematiques",
    "title": "Mathématiques - 1ere Secondaire 1er cycle"
  },
  "page_number": 1,
  "content": "Page text content...",
  "structured_content": {
    "paragraphs": [],
    "titles": [],
    "lists": []
  },
  "word_count": 450
}
```

### 7. Search Course Content
**POST** `/api/v1/content/{niveau}/{annee}/{matiere}/search`

Search for specific content within a course PDF.

#### Request Body:
```json
{
  "query": "équations quadratiques",
  "max_results": 10
}
```

#### Response:
```json
{
  "course": {
    "niveau": "secondaire1",
    "annee": "1ere",
    "matiere": "mathematiques",
    "title": "Mathématiques - 1ere Secondaire 1er cycle"
  },
  "query": "équations quadratiques",
  "results": [
    {
      "page": 42,
      "snippet": "Les équations quadratiques sont...",
      "score": 0.95
    }
  ],
  "total_results": 3
}
```

## Example Usage

### Get all math courses for secondary level 1:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/content/courses?niveau=secondaire1&matiere=mathematiques"
```

### Get page 10 of 1ere secondary mathematics:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/content/secondaire1/1ere/mathematiques/page/10"
```

### Search for "théorème" in a specific course:
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "théorème"}' \
  "http://localhost:8000/api/v1/content/secondaire1/1ere/mathematiques/search"
```

## Available Subjects

The API currently provides access to the following subjects:
- **Mathematics**: mathematiques, mathematiques-c, mathematiques-d
- **Sciences**: sciences, physique, chimie
- **Languages**: francais, arabe, anglais
- **Social Studies**: histoire, geographie
- **Philosophy**: philosophie
- **Civic Education**: education-civique
- **Religious Studies**: education-islamique

## Notes

1. All PDFs are located in the `/content/pdf` directory, organized by level/grade/subject
2. The API automatically discovers available courses based on the file system structure
3. Page numbers are 1-based (first page is page 1)
4. Search functionality uses the pdf_service for content extraction and indexing