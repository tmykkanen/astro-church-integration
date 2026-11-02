import { isValidScriptureRef } from "../lib/scriptureParsing/isValid.ts";

const ScriptureControl = createClass({
	isValid: (value) => {
		if (!isValidScriptureRef(value)) {
			return { error: { message: "Must be a valid scripture reference" } };
		}
		return true;
	},
	render() {
		return h("input", {
			id: this.props.forID,
			className: this.props.classNameWrapper,
			type: "text",
			value: this.props.value ?? "",
			onChange: (e: Event) =>
				this.props.onChange((e.target as HTMLInputElement).value),
		});
	},
});

const ScripturePreview = createClass({
	render() {
		return h("span", {}, String(this.props.value ?? ""));
	},
});

CMS.registerFieldType("scripture", ScriptureControl, ScripturePreview);
