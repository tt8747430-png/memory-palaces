# 01 — Romanian and German interface

Status: needs-triage
Type: task

The app has one locale, `shared/i18n/locales/en/`, one file per domain, and extensions bring their own namespace
(`extensions/bible/i18n/en.ts`). The owner asked for Romanian and German.

To decide: how the language is chosen (a preference that follows the account, or the device's), whether extension
namespaces must ship every language, and who translates. Bible references stay in the translation's language whatever
the interface is (ADR 0009).
