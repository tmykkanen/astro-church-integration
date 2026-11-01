# Astro Church Integration

Astro Church is a church-website Theme distributed as an npm-packaged Astro integration. Sites that use it receive updates through their package manager instead of forking a template.

## Themes

**Theme**:
A complete website design and feature set (routes, layouts, components and styles), distributed as an npm package and installed into a Site as an Astro integration. Here, the Theme is Astro Church.
_Avoid_: Template, starter, theme integration

**Feature**:
An optional section of the Theme with its own routes, such as sermons, blog, calendar or team. The Site Editor enables it through navigation or settings, and can give it a custom URL slug.
_Avoid_: Module, plugin, section

## People

**Theme Author**:
The developer who builds and publishes the Theme.

**Site Developer**:
The person who installs the Theme into a Site, configures it and deploys it. They write code only when customizing.
_Avoid_: Consumer, user (ambiguous)

**Site Editor**:
A non-developer who maintains a Site's content and settings, usually through a git-based CMS, without touching code.
_Avoid_: Admin, end user

## Sites

**Site**:
An Astro project that has the Theme installed, such as a church's website.
_Avoid_: Consumer project, host project

**Starter Site**:
A minimal Site, containing the required wiring files and generic sample content, that a church copies once to begin. It is also the Site the Theme Author develops against.
_Avoid_: Template, playground, demo
