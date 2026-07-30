# Airtable Base Setup — P5 Aptitude

Create a base named **P5 Aptitude** with the tables and fields below. Confirm your Airtable plan is **Team/Pro (50k records)** or higher before production.

## Tables

### Role Families
| Field | Type |
|-------|------|
| RoleCode | Single line text (primary) |
| Name | Single line text |
| Description | Long text |
| ExampleRoles | Long text |
| OutputTemplate | Long text |

### Competencies
| Field | Type |
|-------|------|
| Code | Single line text (primary) |
| Name | Single line text |
| Definition | Long text |

### Role Competency Weights
| Field | Type |
|-------|------|
| RoleCode | Link to Role Families |
| CompetencyCode | Link to Competencies |
| Weight | Number (0–1) |

### Questions
| Field | Type |
|-------|------|
| QuestionID | Single line text (primary) |
| Order | Number |
| Section | Single line text |
| Text | Long text |
| ResponseType | Single select |
| ScoringType | Single select |
| PrimaryCompetency | Single line text |
| SecondaryCompetency | Single line text |
| Required | Checkbox |
| Notes | Long text |

### Question Options
| Field | Type |
|-------|------|
| QuestionID | Link to Questions |
| Key | Single line text |
| Label | Long text |
| ScoreValue | Number |
| MapsTo | Long text |

### Participants
| Field | Type |
|-------|------|
| ParticipantID | Single line text |
| FullName | Single line text |
| Email | Email |
| Phone | Phone |
| CreatedAt | Date |

### Submissions
| Field | Type |
|-------|------|
| SubmissionID | Single line text |
| ParticipantID | Link to Participants |
| Status | Single select: `in_progress`, `completed`, `rejected` |
| ConsentGiven | Checkbox |
| StartedAt | Date |
| CompletedAt | Date |

### Answers
| Field | Type |
|-------|------|
| SubmissionID | Link to Submissions |
| QuestionID | Single line text |
| SelectedOptions | Long text (JSON) |
| CreatedAt | Date |

### Submission Results
| Field | Type |
|-------|------|
| SubmissionID | Link to Submissions |
| CompetencyScores | Long text (JSON) |
| RoleScores | Long text (JSON) |
| **TopRoles** | Long text (JSON) — ranked top 3 recommendations |
| GeneratedAt | Date |

## Sync catalog

After creating the base and setting env vars:

```bash
npm run import-workbook -- --sync-airtable
```

## Personal Access Token

Create a PAT scoped to this base only. Set as `AIRTABLE_API_KEY` in Vercel / `.env.local`.
