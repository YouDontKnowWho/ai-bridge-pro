export async function generateNanoBananaImage(
	apiKey: string,
	prompt: string,
	options?: {
		debug?: boolean;
		logger?: Pick<Console, 'log' | 'warn' | 'error'>;
		requestId?: string;
	}
) {
	const debug = options?.debug !== undefined ? options.debug : true; // enable verbose logs by default per request
	const logger = options?.logger ?? console;
	const rid = options?.requestId ?? Math.random().toString(36).slice(2, 8);
	const log = (...args: any[]) => { if (debug) logger.log('[Gemini]', `[${rid}]`, ...args); };
	const warn = (...args: any[]) => { if (debug) logger.warn('[Gemini]', `[${rid}]`, ...args); };
	const error = (...args: any[]) => { logger.error('[Gemini]', `[${rid}]`, ...args); };

	const redactKey = (k: string) => (k ? `${k.slice(0, 4)}...${k.slice(-2)}` : '<empty>');
	const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

	// Build request
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${encodeURIComponent(apiKey)}`;
	const payload = {
		contents: [
			{
				parts: [
					{ text: prompt }
					// If you need to send an input image, push another part:
					// { inlineData: { mimeType: "image/jpeg", data: "<one-line base64>" } }
				]
			}
		]
	};

	log('Preparing request...',
		{ url: url.replace(/key=[^&]+/, 'key=<REDACTED>') },
		{ apiKey: redactKey(apiKey) },
		{ promptPreview: String(prompt).slice(0, 60), promptLength: String(prompt).length }
	);

	const t0 = now();
	let res: Response | undefined;
	try {
		res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
	} catch (e: any) {
		error('Fetch threw before response', { message: e?.message, code: e?.code, name: e?.name });
		throw e;
	}
	const t1 = now();

	// Log response summary and headers
	const headersSummary: Record<string, string> = {};
	try {
		res.headers?.forEach?.((v, k) => { if (Object.keys(headersSummary).length < 20) headersSummary[k] = v; });
	} catch { /* ignore header iteration errors */ }

	log('Response received', {
		status: res.status, statusText: res.statusText, ms: Math.round(t1 - t0),
		headers: headersSummary
	});

	// Non-2xx path: try to capture body text for diagnostics
	if (!res.ok) {
		let bodyText = '';
		try { bodyText = await res.text(); } catch { /* ignore */ }
		error('HTTP error', { status: res.status, statusText: res.statusText, bodySnippet: bodyText.slice(0, 800) });
		throw new Error(`Gemini request failed: ${res.status} ${res.statusText} ${bodyText}`);
	}

	// Parse JSON with diagnostics
	let json: any;
	const t2 = now();
	try {
		json = await res.json();
	} catch (e: any) {
		let bodyText = '';
		try { bodyText = await res.text(); } catch { /* ignore */ }
		error('JSON parse failed', { message: e?.message, bodySnippet: bodyText.slice(0, 800) });
		throw new Error(`Failed to parse JSON: ${e?.message || e}`);
	}
	const t3 = now();

	const candidatesCnt = Array.isArray(json?.candidates) ? json.candidates.length : 0;
	const parts = json?.candidates?.[0]?.content?.parts ?? [];
	const partKinds = Array.isArray(parts) ? parts.map((p: any) => (p?.inlineData ? 'inlineData' : p?.inline_data ? 'inline_data' : p?.text ? 'text' : typeof p)) : [];
	log('Parsed JSON', {
		parseMs: Math.round(t3 - t2),
		candidates: candidatesCnt,
		parts: parts.length,
		partKinds
	});

	// Find first inlineData part
	const imagePart = parts.find((p: any) => p?.inlineData || p?.inline_data);
	if (!imagePart) {
		warn('No inline image found in response. First part preview:', parts?.[0]);
		throw new Error('No image returned');
	}

	const dataB64: string = imagePart.inlineData?.data ?? imagePart.inline_data?.data;
	if (!dataB64 || typeof dataB64 !== 'string') {
		error('Image data present but invalid type', { type: typeof dataB64 });
		throw new Error('Invalid image data');
	}

	const originalLen = dataB64.length;
	const compactB64 = dataB64.replace(/\s+/g, '');
	if (originalLen !== compactB64.length) {
		log('Stripped whitespace from base64', { originalLen, compactLen: compactB64.length });
	}

	// Safe base64 decode across environments (browser/UXP/Node)
	const b64ToBytes = (b64: string) => {
		try {
			// @ts-ignore global atob may exist
			if (typeof atob === 'function') {
				const binary = atob(b64);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
				return bytes;
			}
		} catch (e) { /* fall through */ }
		try {
			// Node.js fallback
			// @ts-ignore Buffer may exist in some environments
			if (typeof Buffer !== 'undefined') {
				// @ts-ignore
				return new Uint8Array(Buffer.from(b64, 'base64'));
			}
		} catch (e) { /* fall through */ }
		throw new Error('No base64 decoder available in this environment.');
	};

	let bytes: Uint8Array;
	const t4 = now();
	try {
		bytes = b64ToBytes(compactB64);
	} catch (e: any) {
		error('Base64 decode failed', { message: e?.message });
		throw e;
	}
	const t5 = now();

	log('Decoded image', { bytes: bytes.byteLength, decodeMs: Math.round(t5 - t4) });

	return bytes;
}
