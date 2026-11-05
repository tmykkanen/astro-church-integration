interface FieldProps {
	forID: string;
	classNameWrapper: string;
	value: unknown;
	onChange: (value: string) => void;
}

interface FieldSpec {
	isValid?: (value: string) => true | { error: { message: string } };
	render: (this: { props: FieldProps }) => unknown;
}

declare function createClass(spec: FieldSpec): unknown;

declare function h(
	tag: string,
	props: Record<string, unknown>,
	...children: unknown[]
): unknown;

declare const CMS: {
	registerFieldType(name: string, control: unknown, preview?: unknown): void;
};
