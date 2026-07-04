# Turathi AI: Palestinian Cultural Heritage Intelligence PoC

![Project Status](https://img.shields.io/badge/status-proof%20of%20concept-orange)
![React](https://img.shields.io/badge/frontend-React%2019-61DAFB)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6)
![Vite](https://img.shields.io/badge/build-Vite-646CFF)
![AI](https://img.shields.io/badge/AI-Gemini%20%2B%20Teachable%20Machine-4285F4)

Turathi AI is a Proof of Concept (PoC) for an AI-assisted Palestinian cultural heritage platform. It explores how machine learning, language models, and curated cultural references can help users document, interpret, and verify heritage knowledge such as tatreez patterns, proverbs, folk stories, songs, historical place names, and trusted source references.

The real-world problem is that cultural heritage knowledge is often fragmented across archives, oral memory, specialist expertise, and scattered digital sources. This makes it difficult for educators, researchers, museums, cultural organizations, and younger audiences to access reliable context quickly. Solving this problem has business value because it can reduce manual research effort, support cultural education products, improve archive discovery, and create a scalable decision-support layer for heritage institutions.

AI and machine learning are appropriate here because the product concept combines visual recognition, natural-language assistance, structured confidence signals, and automation. The current implementation validates whether these workflows can be presented in a usable application before investing in a production-grade platform.

> This repository is a PoC, not a production-ready system. Its goal is to validate feasibility, user experience, and technical direction.

## Project Vision

Build an AI platform that helps Palestinian cultural organizations and digital heritage teams preserve, explain, and validate cultural knowledge through accessible tools rather than manual research alone.

## Business Problem

Organizations that work with cultural memory often need to answer repeated questions:

- What does this heritage item or visual pattern likely represent?
- Which Palestinian references should a user consult?
- Is a cultural claim clear, incomplete, or potentially inaccurate?
- How can oral heritage such as proverbs, songs, and stories be made searchable and useful?

Without automation, these workflows depend heavily on specialists and are difficult to scale.

## Proposed AI Solution

The PoC demonstrates a multi-tool assistant that combines:

- image classification for uploaded heritage pattern photos.
- LLM-generated cultural explanations and confidence-aware summaries.
- a narrative verification assistant with Palestinian-scope guardrails.
- AI support for Palestinian proverb interpretation and recommendation.
- curated source guidance and historical map access.

## Proof of Concept Scope

Implemented scope:

- React/Vite Arabic RTL interface with a chat-style assistant.
- active routes for `/` and `/map`.
- tool modes for narrative guarding, pattern analysis, proverbs, stories, songs, and sources.
- image upload validation and Teachable Machine inference for pattern classification.
- Express API endpoints for AI text generation, pattern explanation, truth-guard responses, proverb assistance, and map status checks.
- local heritage and proverb data files used by the UI.
- PalOpenMaps embed for historical map exploration.

Out of scope for this PoC:

- production authentication, user accounts, and role management.
- persistent database storage.
- admin dashboards or content management workflows.
- audited ML evaluation metrics.
- enterprise deployment, monitoring, and security hardening.

## Target Users

- museums, archives, and cultural heritage NGOs.
- educators and students working with Palestinian cultural material.
- researchers and documentation teams.
- cultural tourism, storytelling, and media teams.
- founders exploring AI products for heritage preservation.

## Expected Business Impact

If expanded into a product, this concept could:

- reduce time spent answering repeated heritage questions.
- support faster archive discovery and content triage.
- improve educational engagement through conversational interfaces.
- assist non-specialists with first-pass interpretation.
- help organizations scale decision support while keeping expert review in the loop.

## Technical Overview

The application is a full-stack TypeScript PoC. The frontend is a React 19 SPA built with Vite and styled for Arabic RTL usage. The backend is an Express server that serves the Vite app in development and exposes AI endpoints under `/api`.

The ML model used for image recognition is an externally hosted Google Teachable Machine image model. The app loads TensorFlow.js and the Teachable Machine image runtime in the browser, classifies the uploaded image, and sends the top prediction to the backend for an LLM-generated cultural explanation.

The language layer uses Google Gemini by default through `GEMINI_API_KEY`, with optional Groq fallback through `GROQ_API_KEY`. The default Gemini model is `gemini-2.5-flash` unless overridden with `GEMINI_MODEL`.

The dataset inside the repository is lightweight and PoC-oriented: local TypeScript data files contain heritage examples and Palestinian proverbs. The training dataset for the external Teachable Machine model is not included in this repository.

## Machine Learning Pipeline

1. The user uploads an image in the pattern analysis tool.
2. The frontend validates file type and size, then loads the image in the browser.
3. Teachable Machine predicts the most likely visual class and confidence score.
4. The frontend sends the ranked predictions to `/api/scan-pattern`.
5. The backend asks the LLM to produce structured JSON with probable city/region, visual evidence, confidence label, cultural notes, and recommendation.
6. The frontend displays the result as decision support, not a final expert judgment.

## Technologies Used

- React 19
- TypeScript
- Vite
- Express
- Google GenAI SDK
- Gemini / optional Groq fallback
- TensorFlow.js
- Google Teachable Machine
- React Router
- Tailwind CSS / custom CSS
- Lucide React
- Motion
- PalOpenMaps embed

## Future Roadmap

- replace static data with a structured heritage knowledge base.
- add retrieval-augmented generation over trusted Palestinian archives.
- include source citations in every AI response.
- add expert review workflows for museums and researchers.
- store scans, conversations, and validated records with audit history.
- expand model evaluation with labeled image datasets and accuracy reports.
- support multilingual interfaces and translation workflows.

## Future Improvements Toward Production

To evolve this PoC into a production-grade AI platform, the next step would be a managed backend with authentication, database persistence, observability, rate limiting, source retrieval, model evaluation, and human-in-the-loop review. The ML pipeline should be retrained on documented datasets, benchmarked, and paired with explainability and confidence thresholds before being used for operational decisions.

## Limitations

- The system is not an authoritative cultural or historical source.
- AI responses can be incomplete or inaccurate and require expert review.
- The external Teachable Machine model and its training data are not versioned in this repository.
- The PoC does not include formal accuracy, bias, or safety evaluations.
- Several standalone page components exist, but only `/` and `/map` are currently wired in `App.tsx`.
- No production database, authentication, logging, or moderation system is included.

## Getting Started

```bash
npm install
cp .env.example .env
```

Set at least one AI provider key:

```bash
GEMINI_API_KEY="your_key"
# Optional fallback:
GROQ_API_KEY="your_key"
```

Run locally:

```bash
npm run dev
```

Build and type-check:

```bash
npm run build
npm run lint
```
