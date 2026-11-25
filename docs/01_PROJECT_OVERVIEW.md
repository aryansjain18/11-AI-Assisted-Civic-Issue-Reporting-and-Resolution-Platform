# 01 — Project Overview

## Product concept
CivicFix is a web platform through which community members can report civic problems and authorized staff can review, prioritize, and update their resolution status.

## Problem
Issues such as damaged roads, overflowing waste, water leaks, blocked drains, and broken public infrastructure can be difficult to report and track consistently. CivicFix aims to make reporting structured and progress visible.

## Intended users
- **Reporter/citizen:** submits and tracks reports.
- **Reviewer/administrator:** validates reports, manages status and priority, and monitors workload.

Finalize roles and permissions in the requirements and security documents.

## Product principles
1. The core reporting workflow must work without paid AI services.
2. Keep the interface understandable on mobile and desktop.
3. Collect only data needed to operate the service.
4. Make status changes and administrative actions traceable.
5. Never claim a report was sent to a real authority unless that integration exists.
6. Align final scope with the official challenge statement.

## Success signals
- A user can submit a valid report.
- A user can understand the status of their report.
- An authorized reviewer can process a report.
- Invalid and unauthorized actions are rejected.
- Critical flows have automated tests.
- The interface supports keyboard and assistive-technology use.

## Initial non-goals
- Emergency dispatch or guaranteed government response.
- Public exposure of reporter personal information.
- Automated legal, medical, or safety decisions.
- Mandatory paid AI or map APIs.
- Microservices without a demonstrated need.
