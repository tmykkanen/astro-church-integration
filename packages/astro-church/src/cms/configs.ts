export const configs = {
	settings: `media_folder: /src/assets

output:
  omit_empty_optional_fields: true

singletons:
  - name: theme
    label: Theme
    file: src/content/config/theme.yaml
    icon: settings
    fields:
      - name: customCss
        label: Custom Css
        widget: code
        default_language: css
        required: false
`,
	series: `collections:
  - name: series
    label: Sermon Series
    icon: list
    folder: src/content/series
    slug: "{{fields.title}}"
    fields:
      - name: title
        label: Series Title
        widget: string
      - name: date
        label: Start Date
        widget: datetime
        format: "YYYY-MM-DD"
        type: date
      - name: scripture
        label: scripture
        widget: scripture
        required: false
`,
} as const;

export const configKeys = ["backend", ...Object.keys(configs)];
