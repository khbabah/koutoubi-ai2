# Mindmaps Directory

This directory contains pre-created mindmaps from XMind AI.

## File Structure

```
mindmaps/
├── secondaire-2eme-cycle-4eme-mathematiques.json  # Full PDF mindmap
├── secondaire-2eme-cycle-4eme-mathematiques/      # Chapter-specific mindmaps
│   ├── chapitre1.json
│   ├── chapitre2.json
│   └── ...
└── README.md
```

## File Formats Supported

1. **JSON Format** (Recommended)
   - Export from XMind AI as JSON
   - Place in this directory with PDF ID as filename

2. **XMind Format** (.xmind)
   - Native XMind format
   - Will be automatically parsed

## Naming Convention

Files should be named using the PDF ID:
- `{pdf_id}.json` or `{pdf_id}.xmind`

Example:
- `secondaire-2eme-cycle-4eme-mathematiques.json`

## Example JSON Structure

```json
{
  "root": {
    "id": "root",
    "text": "Title",
    "children": [
      {
        "id": "node1",
        "text": "Chapter 1",
        "children": [...]
      }
    ]
  }
}
```