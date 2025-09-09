export type ModerationResult = {
	isSevere: boolean;
	isCaution: boolean;
	matches: string[];
};

const SEVERE_TERMS: string[] = [
	"kill yourself",
	"kys",
	"gas the",
	"ethnic cleanse",
	"hang them",
	"lynch",
	"burn them",
	"shoot them",
	"kill all",
	"rape",
];

const PROFANITY_TERMS: string[] = [
	"fuck",
	"shit",
	"bitch",
	"asshole",
	"bastard",
	"cunt",
	"dick",
	"piss",
	"prick",
	"slut",
	"whore",
];

const HATE_TERMS: string[] = [
	"hate",
	"go back to your country",
	"you people",
	"inferior race",
	"subhuman",
	"vermin",
];

function normalize(input: string): string {
	return input.toLowerCase();
}

export function moderateText(text: string): ModerationResult {
	const t = normalize(text);
	const matches: string[] = [];
	let isSevere = false;
	let isCaution = false;

	for (const phrase of SEVERE_TERMS) {
		if (t.includes(phrase)) {
			matches.push(phrase);
			isSevere = true;
		}
	}
	for (const term of PROFANITY_TERMS) {
		if (t.includes(term)) {
			matches.push(term);
			isCaution = true;
		}
	}
	for (const term of HATE_TERMS) {
		if (t.includes(term)) {
			matches.push(term);
			isCaution = true;
		}
	}

	return { isSevere, isCaution, matches };
}
