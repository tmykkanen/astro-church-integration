import { parser } from "./parser.ts";

export const expandRange = (osis: string): string[] => {
	const [start, end = start] = osis.split("-");
	if (!start || !end) return [];
	if (start === end) return [start];

	const startParts = start.split(".");
	const endParts = end.split(".");
	if (!startParts[0]) return [];

	const chapters = parser.translation_info("default").chapters[startParts[0]];
	if (!chapters) return [];

	// Whole chapter
	if (startParts.length === 2 && endParts.length === 2) {
		const [book, chapter] = startParts;
		const verseCount = chapters[Number(chapter) - 1] ?? 0;

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
	const [, endChapterPart, endVersePart] = endParts;
	const endChapter = Number(endChapterPart);
	const endVerse = Number(endVersePart);

	const results: string[] = [];

	let chapter = Number(startChapter);
	let verse = Number(startVerse);

	while (
		chapter < endChapter ||
		(chapter === endChapter && verse <= endVerse)
	) {
		results.push(`${book}.${chapter}.${verse}`);

		if (chapter === endChapter && verse === endVerse) {
			break;
		}

		const lastVerse = chapters[chapter - 1] ?? 0;

		if (verse < lastVerse) {
			verse++;
		} else {
			chapter++;
			verse = 1;
		}
	}

	return results;
};
