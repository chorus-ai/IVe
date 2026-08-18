# IVe — Integrated Viewer
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**IVe is a clinical research workspace for the OMOP Common Data Model.** It's built for the
CHoRUS project so researchers can search standardized clinical vocabularies, build and inspect
retrospective patient cohorts, and explore a single patient's full record — structured EHR data
(OMOP), extracted concepts from clinical notes, physiological vital signs/alarms/waveforms, and
imaging — all in one place, plus chat with a clinical AI agent to query the data conversationally.

> [!IMPORTANT]
> **Development is currently happening in the internal monorepo**, on the **`develop`** branch:
>
> 👉 **https://github.com/chorus-ai/chorus-apps-internal/tree/develop**
>
> IVe is built there as one app within the CHoRUS apps suite (under `client/src/apps/ive/`).
> Once a containerized release is ready, we will update this repository with the published packages.

## What you can do in IVe

| | |
| --- | --- |
| 🔎 **Search** | Start from a clinical concept (e.g. "diabetes", "metformin") and jump straight to the OMOP table it lives in — no need to already know the schema. |
| 🧑‍🤝‍🧑 **Cohort** | Browse predefined patient cohorts and drill into each member's record. |
| 🧩 **Workspace** | Build a custom dashboard from reusable widgets (demographics, timelines, lab trends, charts) and save it for later. |
| 🔗 **Endpoints** | Save any filtered OMOP query as a reusable, shareable endpoint. |
| 💬 **Agent** | Ask questions about the data in plain language and get an answer plus the underlying query. |
| 🫀 **Person & Visit views** | Drill into any patient or encounter and see everything recorded for it, including multi-channel waveform traces (ECG, plethysmogram, respiration). |

See the [App Pages](#app-pages) section below for a full page-by-page tour, or start at
[docs/SUMMARY.md](docs/SUMMARY.md) for the GitBook table of contents.

Project background: development takes place first at Emory University using an
Emory-equivalent local dataset, in parallel with the CHoRUS data platform build-out and data
acquisition at other sites. Alpha and beta versions are shared with at least one additional
CHoRUS site for testing, with frequent demos to gather feedback from the whole CHoRUS team.

## Table of Contents

- [What you can do in IVe](#what-you-can-do-in-ive)
- [Installation](#installation)
- [Usage](#usage)
- [App Pages](#app-pages)
- [Developer Guides](#developer-guides)
- [Features](#features)
- [Tasks](#tasks)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

## Installation

> Development currently happens in the monorepo — clone it and check out the `develop` branch.
> A containerized release will be published here once ready.

```bash
# Clone the active development repository
git clone https://github.com/chorus-ai/chorus-apps-internal.git
cd chorus-apps-internal
git checkout develop

# Install client dependencies
cd client
npm install
```

## Usage

The frontend is a React app built with [Vite](https://vitejs.dev/); the backend is an
Express server. Run them in two terminals.

```bash
# Server (from server/) — Express on port 8080
cd server
npm install
npm start
```

```bash
# Client (from client/) — Vite dev server on port 5173, proxies /api → localhost:8080
cd client
npm run dev
```

Other client scripts (run from `client/`):

```bash
npm run build     # Production build to dist/
npm run preview   # Preview the production build locally
npm run lint      # ESLint
```

## App Pages

Multi-page reference docs live in [`/docs`](docs/SUMMARY.md), structured for GitBook. This
section documents IVe page by page: what each page does, what the user sees, and which
backend endpoints and app state it relies on. A typical user moves through IVe in roughly
this order:

| # | Page | Route |
| --- | --- | --- |
| 1 | [Search (Landing)](docs/pages/search.md) | `/ive` |
| 2 | [Cohort](docs/pages/cohort.md) | `/ive/cohort`, `/ive/cohort/:id` |
| 3 | [Workspace](docs/pages/workspace.md) | `/ive/workspace` |
| 4 | [Endpoints](docs/pages/endpoints.md) | `/ive/endpoints` |
| 5 | [Agent](docs/pages/agent.md) | `/ive/agent` |
| 6 | [Clinical Tables Overview](docs/pages/clinical-tables.md) | `/ive/tables` |
| 7 | [Clinical Table Detail](docs/pages/clinical-table-detail.md) | `/ive/table/:tableKey` |
| 7a | [Waveform Viewer](docs/pages/waveform.md) | `/ive/table/waveform` |
| 7b | [DICOM Viewer](docs/pages/dicom.md) (coming soon) | `/ive/table/dicom` |
| 8 | [Person Data View](docs/pages/person.md) | `/ive/person/:personId` |
| 9 | [Visit Data View](docs/pages/visit.md) | `/ive/visit/:visitId` |

Each page doc covers: purpose, what the user sees, backend endpoints, relevant app state, and
related components. Source paths referenced throughout are relative to
`client/src/apps/ive/` in the monorepo linked above.

## Developer Guides

- [Widgets](docs/guides/widgets.md) — how the dashboard widget system is structured, and how to
  build and register a new widget.
- [Layouts](docs/guides/layouts.md) — how dashboard layouts are stored, edited in the Workspace,
  and hosted read-only on other pages (e.g. the Person/Visit views).

## DB Schema


## Features

Based on the provided description, here's a breakdown of the features for the integrated viewer (IVe):

1. **Data Visualization:**
   - Support for visualizing structured EHR (OMOP) data.
   - Display of extracted concepts from clinical notes.
   - Visualization of physiological vital signs, alarms, and waveform data.
   - Image data viewer with zoom, pan, and other interactive features.

2. **Interrogation Tools:**
   - Search and filter functionality to quickly locate specific data points or trends.
   - Interactive tools to probe and analyze the displayed data.
   - Annotation and note-taking capabilities for users to mark important findings.
   - Share finginds with other users

3. **Widget Development:**
   - Support for widget layout configuration management. 
   - Independent development modules to allow parallel work on different features.

4. **Local Dataset Integration:**
   - Ability to integrate and work with an equivalent local dataset from Emory University.
   - Compatibility with the CHoRUS data platform and other datasets.

5. **Version Releases:**
   - Alpha and beta version releases for preliminary testing.
   - Update and patch mechanisms to incorporate feedback and improvements.

5. **User Authentication and Authorization:**
   - User registration and login
   - Password recovery
   - Role-based access control

6. **Performance and Optimization:**
   - Fast page load times
   - Image and waveform optimization
   - In-memory caching

7. **Security Features:**
   - SSL certificate implementation
   - Data validation and sanitization
   - Regular security audits
   - Secure login and SSO authentication mechanisms. 
   - Data encryption and privacy controls.
   - Audit trails for tracking user actions and changes.

8. **Data Management and Storage:**
   - Database integration
   - Data backup and recovery
   - Data encryption and security

9. **Integration and API Features:**
   - RESTful API endpoints

11. **User Management and Roles:**
    - Different user roles (e.g., Administrator, User) with specific permissions.
    - User profiles with details, activity logs, and project assignments.
    - A system for inviting new users to the platform or specific projects.

12. **Reporting and Analytics:**
    - Detailed reports on adjudication and annotation outcomes.
    - Visualization tools for data patterns and annotations.
    - Export functionality for reports and data.
   
13. **Help and Documentation:**
    - Detailed documentation on using the platform and its features.
    - FAQ section and support ticketing system.

14. **Responsive Design:**
    - The application should adapt to most common browsers and different screen sizes, ensuring usability on desktops, and  tablets.

15. **Customization and Settings:**
    - Theme customization to align with the branding of CHoRUS or specific projects.
    - User-specific settings for notifications, display preferences(light or dark) .

15. **Maintenance and Support:**
    - Bug fixes
    - Regular updates
    - Customer support


## Tasks 

<details>
    <summary>15.1 Set up software development and local deployment environment at Emory</summary>

- [x] 15.1.1 Set up the team mangement environment
- [x] 15.1.2 Set up the development environment
- [x] 15.1.3 Set up the production environment on Emory AWS Cloud
- [x] 15.1.4 Set up the DNS and Firewall Rule Exception with Emory IT
- [ ] 15.1.1 Configure cloud environment
- [ ] 15.1.2  Launch Alpha testing and get feedbacks
- [x] 15.1.3 Document APT with OpenAPI 3.0 Specification and authenticate AP routes
</details>


 <details>
    <summary>15.2 Design and develop IVe database architecture. This database will store patient data, data about users, data generated by users using IVe</summary>

- [x] 15.2.1 Design and develop table schemes with future expansion in mind
- [x] 15.2.2 Define relationships and constraints between the tables
- [x] 15.2.1 Quick prototyping and feedback around clinical data component's user interface it widget-like tiles management
</details>

 <details>
    <summary>15.3 Design and develop user authentication and management module</summary>

- [x] 15.3.1 Setup OAuth 2.0 to secure the REST APIs
- [x] 15.3.2 Setup Single Sign-on (SSO)
- [ ] 15.3.3 Setup Security Assertion Markup Language (SAML)
- [ ] 15.3.4 Setup one-time codes delivered by email or SMS to handle broken password
- [x] 15.3.1 Develop front-end UI
- [x] 15.3.2 Develop back-end logic
</details>

 <details>
    <summary>15.4 Design and develop patient search/list module</summary>

- [x] 15.4.1 Design a search logic, implement auto-suggest mechanism and ensure lazy-loading on results
- [x] 15.4.2 Design and develop UI and corresponding filtering options
- [x] 15.4.1 Develp front-end UI
- [ ] 15.4.2 Develp back-end logic
</details>

<details>
    <summary>15.5 Design and develop patient timeline/navigator module</summary>

- [x] 15.5.1 Implment back-end services to extract multi model data from database
- [x] 15.5.2 Design and develop user roles and features
- [x] 15.5.3 Design and develp UI according to the user role and features
- [x] 15.5.1 Quick prototyping and feedback around patient search and resulting patient list
- [ ] 15.5.2 Patient search with search history preserved
- [ ] 15.5.3 Setup/develop caching logic in Cloud instance
</details>

<details>
    <summary>15.6 Design and develop dashboard module</summary>

- [x] 15.6.1 Design and develop independent compents to create, names, edited, persisted, deleted, and shared like widget style dashboard
- [x] 15.6.2 Design and develop share snapshot of the dashboard to another user to review
- [x] 15.6.1 Map OMOP alarm data to IVe alarm module and develop back-end services
- [x] 15.6.2 Map OMOP lab tests data to IVe lab module and develop back-end services
- [x] 15.6.3 Map OMOP vitals data to IVe vitals module and develop back-end serices
</details>

<details>
    <summary>15.7 Design and develop laboratory test results module</summary>

- [x] 15.7.1 Design and draft various wireframes
- [ ] 15.7.2 Select the design based on feedback from CHoRUS team
- [ ] 15.7.3 Design options and selection will be recorded on the JIRA page
- [ ] 15.7.4 Implement data retrieval APIs
- [ ] 15.7.5 Implement and release an alpha version
- [ ] 15.7.6 Implement and release a beta version
- [ ] 15.7.7 Implement and release 1.0 version
- [ ] 15.7.8 Maintain and feature expansion
</details>

<details>
    <summary>15.8 Design and develop NLP-extracted concept module</summary>

- [x] 15.8.1 Prepre clinical concepts form the raw clincial notes and design object relational model in the structured database
- [x] 15.8.2 Develop notes component in the client and controller/model in teh server
</details>

 <details>
    <summary>15.9 Deploy IVe in the CHoRUS data platform</summary>

- [ ] 15.9.1 Add embedding in the CHoRUS data platform to redirect to IVe hosting server
</details>

 <details>
    <summary>15.10 Design and develop medication order/administration module</summary>

- [ ] 15.10.1 Perform data element mapping to follow OMOP Common Data Model convention on drug exposure
- [ ] 15.10.2 Perform ETL strategy as more data pouring in
</details>

 <details>
    <summary>15.11 Design and develop vital sign module</summary>

- [ ] 15.11.1 Perform data element mapping to follow OMOP Common Data Model convention using measurement object
- [ ] 15.11.2 Perform ETL strategy as more ata pouringorm ETL strategy as more data pouring in
</details>

 <details>
    <summary>15.12 Design and develop physiological waveform patient monitor</summary>

- [ ] 15.12.1 Perform data element mapping to follow OMOP Common Data Model convention using observation object
- [ ] 15.12.2 Perform ETL strategy as more data pouring in
</details>

 <details>
    <summary>15.13 Design and develop image module</summary>

- [ ] 15.13.1 Custom image table will be designed and developed in the OMOP Common Data Mode
- [ ] 15.13.2 Perform data element mapping to follow OMOP Common data Model convention in the usom image object
</details>

## Contributing

Development currently happens in the monorepo:
**https://github.com/chorus-ai/chorus-apps-internal/tree/develop**

1. Clone `chorus-apps-internal` and check out `develop`
2. Create a new branch off `develop`: `git checkout -b feature-branch`
3. Make changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature-branch`
5. Open a pull request **against the `develop` branch**

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT). See the [LICENSE](LICENSE) file for more details.

## Acknowledgements

- [Library](https://link-to-library)
- [Tutorial](https://link-to-tutorial)
- [Stack Overflow](https://stackoverflow.com/) for answering my questions

## Contact

- Email: dbold@emory.edu
- Website: https://nursingdatascience.emory.edu
