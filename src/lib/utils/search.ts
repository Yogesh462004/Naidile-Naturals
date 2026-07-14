/**
 * Calculates the Levenshtein distance between two strings a and b.
 */
function levenshtein(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					matrix[i][j - 1] + 1, // insertion
					matrix[i - 1][j] + 1 // deletion
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Checks if queryWord matches targetText using case-insensitive inclusion,
 * digit normalization (for phones/PIN codes), or fuzzy Levenshtein distance.
 */
function fuzzyWordMatch(queryWord: string, targetText: string): boolean {
	if (!queryWord || !targetText) return false;

	const q = queryWord.toLowerCase().trim();
	const t = targetText.toLowerCase().trim();

	// 1. Direct case-insensitive substring inclusion
	if (t.includes(q)) return true;

	// 2. Numeric comparison (e.g. mobile number or PIN codes or exact digits)
	const qDigits = q.replace(/\D/g, '');
	const tDigits = t.replace(/\D/g, '');
	if (qDigits.length >= 3 && tDigits.length >= 3) {
		if (tDigits.includes(qDigits) || qDigits.includes(tDigits)) return true;
		// Also allow last 10 digits match
		const qLast10 = qDigits.slice(-10);
		const tLast10 = tDigits.slice(-10);
		if (qLast10.length >= 7 && tLast10.length >= 7 && (tLast10.includes(qLast10) || qLast10.includes(tLast10))) {
			return true;
		}
	}

	// 3. Fuzzy match against words inside targetText
	const tWords = t.split(/[^a-z0-9]+/);
	for (const tWord of tWords) {
		if (!tWord) continue;
		if (tWord.includes(q) || q.includes(tWord)) return true;

		// Allow 1 typo for words with length 4-5, and up to 2 typos for words > 5
		const maxDist = q.length > 5 ? 2 : q.length >= 4 ? 1 : 0;
		if (maxDist > 0 && Math.abs(tWord.length - q.length) <= maxDist) {
			const dist = levenshtein(q, tWord);
			if (dist <= maxDist) return true;
		}
	}

	return false;
}

/**
 * Checks if all words in search query match at least one field in the candidate string or fields array.
 */
export function smartSearchMatch(searchQuery: string, candidateFields: (string | null | undefined)[]): boolean {
	if (!searchQuery || !searchQuery.trim()) return true;

	const validFields = candidateFields.filter((f): f is string => typeof f === 'string' && f.trim().length > 0);
	if (validFields.length === 0) return false;

	const combinedTargetText = validFields.join(' ');
	const queryWords = searchQuery.toLowerCase().trim().split(/\s+/);

	// Every word in the user's search query must match at least something across all candidate fields
	return queryWords.every((qWord) => fuzzyWordMatch(qWord, combinedTargetText));
}
