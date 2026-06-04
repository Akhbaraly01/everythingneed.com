# Shared Layer

Reusable UI primitives and framework-agnostic utilities consumed by all modules.

Rule: **no business logic here**. If a piece of code knows about orders, doctors, or vendors, it belongs in a module, not `@shared`.
