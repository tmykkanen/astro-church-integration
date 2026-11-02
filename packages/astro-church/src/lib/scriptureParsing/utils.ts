import { parser } from "./parser.ts";

export const expandRange = (input: string): string[] => {
	const osis = parser.parse(input).osis();
	if (!osis) return [];

	const [start, end = start] = osis.split("-");
	if (start === end) return [start];

	const startParts = start.split(".");
	const endParts = end.split(".");

	const chapters = parser.translation_info("default").chapters[startParts[0]];

	// Whole chapter
	if (startParts.length === 2 && endParts.length === 2) {
		const [book, chapter] = startParts;
		const verseCount = chapters[Number(chapter) - 1];

		return Array.from(
			{ length: verseCount },
			(_, i) => `${book}.${chapter}.${i + 1}`,
		);
	}

	// Single verse
	if (start === end && startParts.length === 3) {
		return [start];
	}

	const [book, startChapter, startVerse] = startParts;
	const [, endChapter, endVerse] = endParts;

	const results: string[] = [];

	let chapter = Number(startChapter);
	let verse = Number(startVerse);

	while (
		chapter < Number(endChapter) ||
		(chapter === Number(endChapter) && verse <= Number(endVerse))
	) {
		results.push(`${book}.${chapter}.${verse}`);

		if (chapter === Number(endChapter) && verse === Number(endVerse)) {
			break;
		}

		const lastVerse = chapters[chapter - 1];

		if (verse < lastVerse) {
			verse++;
		} else {
			chapter++;
			verse = 1;
		}
	}

	return results;
};
