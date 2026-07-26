//#region extension/src/adapters/nyt.ts
/**
* Adapter for Official NYT Wordle and Wordle Unlimited.
*/
var NytAdapter = class {
	constructor() {
		this.info = {
			id: "nyt",
			name: "NYT Wordle / Unlimited",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		const host = window.location.hostname;
		return host.includes("nytimes.com") || host.includes("wordleunlimited.org");
	}
	readBoard(boardIndex = 0) {
		const isUnlimited = window.location.hostname.includes("wordleunlimited.org");
		let tiles = [];
		if (isUnlimited) {
			const gameApp = document.querySelector("game-app");
			if (gameApp && gameApp.shadowRoot) {
				const gameRows = Array.from(gameApp.shadowRoot.querySelectorAll("game-row"));
				for (const row of gameRows) if (row.shadowRoot) {
					const rowTiles = Array.from(row.shadowRoot.querySelectorAll("game-tile"));
					tiles.push(...rowTiles);
				}
			}
		} else {
			let stateTiles = Array.from(document.querySelectorAll("[data-state]"));
			stateTiles = stateTiles.filter((el) => el.tagName !== "BUTTON");
			if (stateTiles.length === 30) tiles = stateTiles;
			else tiles = Array.from(document.querySelectorAll("[class*=\"Tile-module\"]"));
		}
		const rows = [];
		for (let r = 0; r < 6; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const tile = tiles[r * 5 + c];
				if (tile) {
					const letter = (tile.getAttribute("data-letter") || tile.textContent || "").trim().toLowerCase();
					const rawState = (tile.getAttribute("data-state") || tile.getAttribute("evaluation") || "empty").toLowerCase();
					let state = "empty";
					if (rawState.includes("correct")) state = "correct";
					else if (rawState.includes("present")) state = "present";
					else if (rawState.includes("absent")) state = "absent";
					else if (rawState.includes("tbd")) state = "tbd";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 6;
		for (let r = 0; r < 6; r++) {
			const rowStates = rows[r].map((t) => t.state);
			const isEvaluated = rowStates.every((s) => s === "correct" || s === "present" || s === "absent");
			const isEmpty = rowStates.every((s) => s === "empty");
			const hasTbd = rowStates.some((s) => s === "tbd");
			if (isEmpty || hasTbd || !isEvaluated) {
				currentRow = r;
				break;
			}
		}
		let gameStatus = "playing";
		try {
			if (isUnlimited) {
				const stored = JSON.parse(localStorage.getItem("gameState") || "{}");
				if (stored.gameStatus === "WIN") gameStatus = "won";
				else if (stored.gameStatus === "FAIL") gameStatus = "lost";
			} else {
				const stateKey = Object.keys(localStorage).find((k) => k.includes("wordle") && k.includes("state"));
				if (stateKey) {
					const stored = JSON.parse(localStorage.getItem(stateKey) || "{}");
					if (stored.gameStatus === "WIN") gameStatus = "won";
					else if (stored.gameStatus === "FAIL") gameStatus = "lost";
				}
			}
		} catch {
			if (currentRow > 0) {
				if (rows[currentRow - 1]?.every((t) => t.state === "correct")) gameStatus = "won";
				else if (currentRow >= 6) gameStatus = "lost";
			}
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		const isUnlimited = window.location.hostname.includes("wordleunlimited.org");
		for (const char of word) {
			this.dispatchKey(char, isUnlimited);
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		this.dispatchKey("Enter", isUnlimited);
	}
	dispatchKey(key, isUnlimited) {
		const keyUpper = key.toUpperCase();
		if (isUnlimited) {
			const gameApp = document.querySelector("game-app");
			if (gameApp && gameApp.shadowRoot) {
				const keyboard = gameApp.shadowRoot.querySelector("game-keyboard");
				if (keyboard && keyboard.shadowRoot) {
					const btn = keyboard.shadowRoot.querySelector(`button[data-key="${keyUpper === "ENTER" ? "↵" : keyUpper}"]`) || keyboard.shadowRoot.querySelector(`button[data-key="${keyUpper}"]`);
					if (btn) {
						btn.click();
						return;
					}
				}
			}
		}
		const keyButton = document.querySelector(`button[data-key="${keyUpper}"]`) || document.querySelector(`button[data-key="${key}"]`);
		if (keyButton) keyButton.click();
		else window.dispatchEvent(new KeyboardEvent("keydown", {
			key,
			code: `Key${keyUpper}`,
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1800));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keyButtons = Array.from(document.querySelectorAll("button[data-key]"));
		for (const btn of keyButtons) {
			const key = (btn.getAttribute("data-key") || "").toLowerCase();
			const state = (btn.getAttribute("data-state") || "empty").toLowerCase();
			if (key && key.length === 1 && key >= "a" && key <= "z") if (state.includes("correct")) kb[key] = "correct";
			else if (state.includes("present")) kb[key] = "present";
			else if (state.includes("absent")) kb[key] = "absent";
			else kb[key] = "empty";
		}
		return kb;
	}
	isGameFinished() {
		const state = this.readBoard(0);
		return state.gameStatus === "won" || state.gameStatus === "lost";
	}
};
//#endregion
//#region extension/src/adapters/hellowordl.ts
var HelloWordlAdapter = class {
	constructor() {
		this.info = {
			id: "hellowordl",
			name: "Hello Wordl",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		return window.location.hostname.includes("hellowordl.net");
	}
	readBoard(boardIndex = 0) {
		const tileElements = Array.from(document.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 6; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tileElements[r * 5 + c];
				if (el) {
					const letter = (el.textContent || "").trim().toLowerCase();
					const className = (el.className || "").toLowerCase();
					const attrState = (el.getAttribute("data-state") || "").toLowerCase();
					let state = "empty";
					if (className.includes("correct") || attrState.includes("correct")) state = "correct";
					else if (className.includes("present") || attrState.includes("present")) state = "present";
					else if (className.includes("absent") || attrState.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 6;
		for (let r = 0; r < 6; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0) {
			if (rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
			else if (currentRow >= 6) gameStatus = "lost";
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1500));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		const s = this.readBoard(0);
		return s.gameStatus === "won" || s.gameStatus === "lost";
	}
};
//#endregion
//#region extension/src/adapters/dordle.ts
var DordleAdapter = class {
	constructor() {
		this.info = {
			id: "dordle",
			name: "Dordle (2 Boards)",
			boardCount: 2,
			isMultiBoard: true,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		const host = window.location.hostname;
		return host.includes("dordle.io") || host.includes("zaratustra.itch.io/dordle");
	}
	readBoard(boardIndex = 0) {
		const targetBoard = Array.from(document.querySelectorAll(".board, [class*=\"board\"], [id*=\"board\"]"))[boardIndex] || document.body;
		const tiles = Array.from(targetBoard.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 7; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || el.getAttribute("data-letter") || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					const stateAttr = (el.getAttribute("data-state") || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || stateAttr.includes("correct")) state = "correct";
					else if (cls.includes("present") || stateAttr.includes("present")) state = "present";
					else if (cls.includes("absent") || stateAttr.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 7;
		for (let r = 0; r < 7; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0) {
			if (rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
			else if (currentRow >= 7) gameStatus = "lost";
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0), this.readBoard(1)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1800));
		return this.readBoard(boardIndex).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll("button[data-key], .key"));
		for (const k of keys) {
			const txt = (k.getAttribute("data-key") || k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				const state = (k.getAttribute("data-state") || "").toLowerCase();
				if (cls.includes("correct") || state.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present") || state.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent") || state.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		const b1 = this.readBoard(0);
		const b2 = this.readBoard(1);
		return b1.gameStatus !== "playing" && b2.gameStatus !== "playing";
	}
};
//#endregion
//#region extension/src/adapters/quordle.ts
var QuordleAdapter = class {
	constructor() {
		this.info = {
			id: "quordle",
			name: "Quordle (4 Boards)",
			boardCount: 4,
			isMultiBoard: true,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		const host = window.location.hostname;
		return host.includes("quordle.com") || host.includes("merriam-webster.com/games/quordle");
	}
	readBoard(boardIndex = 0) {
		const targetBoard = Array.from(document.querySelectorAll("[aria-label*=\"Board\"], [class*=\"Board\"], .board"))[boardIndex] || document.body;
		const tiles = Array.from(targetBoard.querySelectorAll("[aria-label*=\"Tile\"], [class*=\"Tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 9; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || el.getAttribute("data-letter") || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					const stateAttr = (el.getAttribute("data-state") || el.getAttribute("aria-label") || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || stateAttr.includes("correct")) state = "correct";
					else if (cls.includes("present") || stateAttr.includes("present")) state = "present";
					else if (cls.includes("absent") || stateAttr.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 9;
		for (let r = 0; r < 9; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0) {
			if (rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
			else if (currentRow >= 9) gameStatus = "lost";
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [
			0,
			1,
			2,
			3
		].map((i) => this.readBoard(i));
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			const btn = document.querySelector(`button[data-key="${char.toUpperCase()}"]`) || document.querySelector(`button[aria-label="${char.toUpperCase()}"]`);
			if (btn) btn.click();
			else window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		const enterBtn = document.querySelector("button[data-key=\"Enter\"]") || document.querySelector("button[aria-label=\"Enter\"]");
		if (enterBtn) enterBtn.click();
		else window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 2e3));
		return this.readBoard(boardIndex).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll("button[data-key], button[aria-label]"));
		for (const k of keys) {
			const txt = (k.getAttribute("data-key") || k.getAttribute("aria-label") || k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		return this.readAllBoards().every((b) => b.gameStatus !== "playing");
	}
};
//#endregion
//#region extension/src/adapters/octordle.ts
var OctordleAdapter = class {
	constructor() {
		this.info = {
			id: "octordle",
			name: "Octordle (8 Boards)",
			boardCount: 8,
			isMultiBoard: true,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		return window.location.hostname.includes("octordle.com");
	}
	readBoard(boardIndex = 0) {
		const targetBoard = Array.from(document.querySelectorAll("[id*=\"board\"], [class*=\"board\"], .octordle-board"))[boardIndex] || document.body;
		const tiles = Array.from(targetBoard.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 13; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || el.getAttribute("data-letter") || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					const stateAttr = (el.getAttribute("data-state") || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || stateAttr.includes("correct")) state = "correct";
					else if (cls.includes("present") || stateAttr.includes("present")) state = "present";
					else if (cls.includes("absent") || stateAttr.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 13;
		for (let r = 0; r < 13; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0) {
			if (rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
			else if (currentRow >= 13) gameStatus = "lost";
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return Array.from({ length: 8 }, (_, i) => this.readBoard(i));
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 2200));
		return this.readBoard(boardIndex).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		return this.readAllBoards().every((b) => b.gameStatus !== "playing");
	}
};
//#endregion
//#region extension/src/adapters/sedecordle.ts
var SedecordleAdapter = class {
	constructor() {
		this.info = {
			id: "sedecordle",
			name: "Sedecordle (16 Boards)",
			boardCount: 16,
			isMultiBoard: true,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		return window.location.hostname.includes("sedecordle.com");
	}
	readBoard(boardIndex = 0) {
		const targetBoard = Array.from(document.querySelectorAll("[id*=\"board\"], [class*=\"board\"], .grid"))[boardIndex] || document.body;
		const tiles = Array.from(targetBoard.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 21; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || el.getAttribute("data-letter") || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					const stateAttr = (el.getAttribute("data-state") || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || stateAttr.includes("correct")) state = "correct";
					else if (cls.includes("present") || stateAttr.includes("present")) state = "present";
					else if (cls.includes("absent") || stateAttr.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 21;
		for (let r = 0; r < 21; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0) {
			if (rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
			else if (currentRow >= 21) gameStatus = "lost";
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return Array.from({ length: 16 }, (_, i) => this.readBoard(i));
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 2500));
		return this.readBoard(boardIndex).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		return this.readAllBoards().every((b) => b.gameStatus !== "playing");
	}
};
//#endregion
//#region extension/src/adapters/hurdle.ts
var HurdleAdapter = class {
	constructor() {
		this.info = {
			id: "hurdle",
			name: "Hurdle (Multi-Round)",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: true,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		const loc = window.location.href;
		return loc.includes("arkadium.com/games/hurdle") || loc.includes("hurdle");
	}
	readBoard(boardIndex = 0) {
		const tiles = Array.from(document.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 6; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					const stateAttr = (el.getAttribute("data-state") || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || stateAttr.includes("correct")) state = "correct";
					else if (cls.includes("present") || stateAttr.includes("present")) state = "present";
					else if (cls.includes("absent") || stateAttr.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 6;
		for (let r = 0; r < 6; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0) {
			if (rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
			else if (currentRow >= 6) gameStatus = "lost";
		}
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1800));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		const s = this.readBoard(0);
		return s.gameStatus === "won" || s.gameStatus === "lost";
	}
	async reset() {
		await new Promise((r) => setTimeout(r, 500));
	}
};
//#endregion
//#region extension/src/adapters/absurdle.ts
var AbsurdleAdapter = class {
	constructor() {
		this.info = {
			id: "absurdle",
			name: "Absurdle (Adversarial)",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		return window.location.hostname.includes("qntm.org/files/absurdle") || window.location.pathname.includes("absurdle");
	}
	readBoard(boardIndex = 0) {
		const tiles = Array.from(document.querySelectorAll(".tile, [class*=\"tile\"], td"));
		const rows = [];
		const totalRows = Math.max(6, Math.floor(tiles.length / 5));
		for (let r = 0; r < totalRows; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					let state = "empty";
					if (cls.includes("exact") || cls.includes("correct")) state = "correct";
					else if (cls.includes("inexact") || cls.includes("present")) state = "present";
					else if (cls.includes("wrong") || cls.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = totalRows;
		for (let r = 0; r < totalRows; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0 && rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1200));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("exact") || cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("inexact") || cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("wrong") || cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		return this.readBoard(0).gameStatus === "won";
	}
};
//#endregion
//#region extension/src/adapters/evilwordle.ts
var EvilWordleAdapter = class {
	constructor() {
		this.info = {
			id: "evilwordle",
			name: "Evil Wordle",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		const loc = window.location.href;
		return loc.includes("swag.github.io/evil-wordle") || loc.includes("evil-wordle");
	}
	readBoard(boardIndex = 0) {
		const tiles = Array.from(document.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 6; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || cls.includes("green")) state = "correct";
					else if (cls.includes("present") || cls.includes("yellow")) state = "present";
					else if (cls.includes("absent") || cls.includes("gray")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 6;
		for (let r = 0; r < 6; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0 && rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
		else if (currentRow >= 6) gameStatus = "lost";
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1500));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		const s = this.readBoard(0);
		return s.gameStatus === "won" || s.gameStatus === "lost";
	}
};
//#endregion
//#region extension/src/adapters/kilordle.ts
var KilordleAdapter = class {
	constructor() {
		this.info = {
			id: "kilordle",
			name: "Kilordle (Sequential 1000 Boards)",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: false,
			isSequential: true,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		return window.location.hostname.includes("kilordle.com");
	}
	readBoard(boardIndex = 0) {
		const tiles = Array.from(document.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 6; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct")) state = "correct";
					else if (cls.includes("present")) state = "present";
					else if (cls.includes("absent")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 6;
		for (let r = 0; r < 6; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0 && rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1200));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		return this.readBoard(0).gameStatus === "won";
	}
	async reset() {
		await new Promise((r) => setTimeout(r, 300));
	}
};
//#endregion
//#region extension/src/adapters/lingle.ts
var LingleAdapter = class {
	constructor() {
		this.info = {
			id: "lingle",
			name: "Lingle",
			boardCount: 1,
			isMultiBoard: false,
			isMultiRound: false,
			isSequential: false,
			supportsAutoPlay: true
		};
	}
	detectGame() {
		const host = window.location.hostname;
		return host.includes("lingle.today") || host.includes("lingle");
	}
	readBoard(boardIndex = 0) {
		const tiles = Array.from(document.querySelectorAll(".tile, [class*=\"tile\"], [data-state]"));
		const rows = [];
		for (let r = 0; r < 6; r++) {
			const row = [];
			for (let c = 0; c < 5; c++) {
				const el = tiles[r * 5 + c];
				if (el) {
					const letter = (el.textContent || "").trim().toLowerCase();
					const cls = (el.className || "").toLowerCase();
					let state = "empty";
					if (cls.includes("correct") || cls.includes("right")) state = "correct";
					else if (cls.includes("present") || cls.includes("misplaced")) state = "present";
					else if (cls.includes("absent") || cls.includes("wrong")) state = "absent";
					row.push({
						letter,
						state
					});
				} else row.push({
					letter: "",
					state: "empty"
				});
			}
			rows.push(row);
		}
		let currentRow = 6;
		for (let r = 0; r < 6; r++) if (!rows[r].every((t) => t.state === "correct" || t.state === "present" || t.state === "absent")) {
			currentRow = r;
			break;
		}
		let gameStatus = "playing";
		if (currentRow > 0 && rows[currentRow - 1].every((t) => t.state === "correct")) gameStatus = "won";
		else if (currentRow >= 6) gameStatus = "lost";
		return {
			rows,
			currentRow,
			gameStatus
		};
	}
	readAllBoards() {
		return [this.readBoard(0)];
	}
	async submitGuess(word, delay) {
		for (const char of word) {
			window.dispatchEvent(new KeyboardEvent("keydown", {
				key: char,
				code: `Key${char.toUpperCase()}`,
				bubbles: true
			}));
			await new Promise((r) => setTimeout(r, delay));
		}
		await new Promise((r) => setTimeout(r, delay));
		window.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Enter",
			code: "Enter",
			bubbles: true
		}));
	}
	async waitForReveal(boardIndex, rowIndex) {
		await new Promise((r) => setTimeout(r, 1500));
		return this.readBoard(0).rows[rowIndex] || [];
	}
	getKeyboardState() {
		const kb = {};
		const keys = Array.from(document.querySelectorAll(".key, button"));
		for (const k of keys) {
			const txt = (k.textContent || "").trim().toLowerCase();
			if (txt.length === 1 && txt >= "a" && txt <= "z") {
				const cls = (k.className || "").toLowerCase();
				if (cls.includes("correct")) kb[txt] = "correct";
				else if (cls.includes("present")) kb[txt] = "present";
				else if (cls.includes("absent")) kb[txt] = "absent";
				else kb[txt] = "empty";
			}
		}
		return kb;
	}
	isGameFinished() {
		const s = this.readBoard(0);
		return s.gameStatus === "won" || s.gameStatus === "lost";
	}
};
//#endregion
//#region extension/src/adapters/adapterRegistry.ts
var ALL_ADAPTERS = [
	new NytAdapter(),
	new HelloWordlAdapter(),
	new DordleAdapter(),
	new QuordleAdapter(),
	new OctordleAdapter(),
	new SedecordleAdapter(),
	new HurdleAdapter(),
	new AbsurdleAdapter(),
	new EvilWordleAdapter(),
	new KilordleAdapter(),
	new LingleAdapter()
];
/**
* Automatically detects and returns the matching GameAdapter for the current website.
* Returns null if the website is not a supported Wordle clone.
*/
function detectActiveAdapter() {
	for (const adapter of ALL_ADAPTERS) try {
		if (adapter.detectGame()) return adapter;
	} catch {}
	return null;
}
//#endregion
//#region extension/src/content/content.ts
var DEFAULT_TYPING_DELAY = 120;
var typingDelay = DEFAULT_TYPING_DELAY;
var currentMode = "auto";
var activeAdapter = detectActiveAdapter();
var assistLoopTimeout = null;
function stopAssistLoop() {
	if (assistLoopTimeout !== null) {
		window.clearTimeout(assistLoopTimeout);
		assistLoopTimeout = null;
	}
}
function startAssistLoop(initialRow) {
	stopAssistLoop();
	let lastCheckedRow = initialRow;
	const poll = () => {
		if (!activeAdapter) return;
		const boardState = activeAdapter.readBoard(0);
		const currentRow = boardState.currentRow;
		if (boardState.gameStatus === "won") {
			updateBadge("🏆 SOLVED!");
			stopAssistLoop();
			return;
		}
		if (boardState.gameStatus === "lost") {
			updateBadge("❌ GAME OVER");
			stopAssistLoop();
			return;
		}
		if (currentRow > lastCheckedRow) {
			lastCheckedRow = currentRow;
			updateBadge("🧠 Thinking...");
			chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
				if (chrome.runtime.lastError) return;
				if (response?.success && response.data) {
					const state = response.data;
					if (state.currentGuess) updateBadge(`💡 Rec: ${state.currentGuess}`);
					else updateBadge("💡 Thinking...");
				}
			});
		}
		assistLoopTimeout = window.setTimeout(poll, 500);
	};
	poll();
}
var shadowRootRef = null;
function getShadowElement(id) {
	return shadowRootRef ? shadowRootRef.getElementById(id) : null;
}
function updateBadgeModeIndicator() {
	const badge = getShadowElement("wordle-solver-badge");
	if (badge) {
		const txt = badge.textContent || "";
		if (txt === "🧠 Solver Ready" || txt === "🤝 Assist Ready" || txt.startsWith("💡 Rec:") || txt === "💡 No Rec" || txt === "🧠 Thinking...") badge.textContent = currentMode === "auto" ? "🧠 Solver Ready" : "🤝 Assist Ready";
	}
	const autoItem = getShadowElement("wordle-solver-item-auto");
	const assistItem = getShadowElement("wordle-solver-item-assist");
	if (autoItem && assistItem) if (currentMode === "auto") {
		autoItem.classList.add("active");
		assistItem.classList.remove("active");
	} else {
		autoItem.classList.remove("active");
		assistItem.classList.add("active");
	}
}
function createStatusBadge() {
	const existing = document.getElementById("wordle-solver-host");
	if (existing) existing.remove();
	const host = document.createElement("div");
	host.id = "wordle-solver-host";
	document.body.appendChild(host);
	const shadowRoot = host.attachShadow({ mode: "open" });
	shadowRootRef = shadowRoot;
	const styleEl = document.createElement("style");
	styleEl.textContent = `
#wordle-solver-wrapper {
  position: fixed;
  top: 16px;
  right: 0px !important;
  z-index: 99999;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 4px;
  height: 32px;
  font-family: 'Bebas Neue', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

#wordle-solver-wrapper:hover {
  background: #f4f4f5;
}

#wordle-solver-badge {
  color: #000000;
  padding: 0 10px 0 12px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  height: 100%;
}

#wordle-solver-menu-btn {
  background: transparent;
  color: #000000;
  border: none;
  border-left: 1px solid rgba(0, 0, 0, 0.2);
  width: 28px;
  height: 100%;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: all 0.2s ease;
}

#wordle-solver-menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

#wordle-solver-menu-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

#wordle-solver-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 6px;
  min-width: 150px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

#wordle-solver-dropdown.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.wordle-solver-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.wordle-solver-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.wordle-solver-dropdown-item .check {
  margin-left: auto;
  color: #10b981;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.wordle-solver-dropdown-item.active .check {
  opacity: 1;
}
  `;
	shadowRoot.appendChild(styleEl);
	const wrapper = document.createElement("div");
	wrapper.id = "wordle-solver-wrapper";
	const badge = document.createElement("div");
	badge.id = "wordle-solver-badge";
	badge.textContent = currentMode === "auto" ? "🧠 Solver Ready" : "🤝 Assist Ready";
	const menuBtn = document.createElement("button");
	menuBtn.id = "wordle-solver-menu-btn";
	menuBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
  `;
	const dropdown = document.createElement("div");
	dropdown.id = "wordle-solver-dropdown";
	const autoItem = document.createElement("div");
	autoItem.id = "wordle-solver-item-auto";
	autoItem.className = `wordle-solver-dropdown-item${currentMode === "auto" ? " active" : ""}`;
	autoItem.innerHTML = `
    <span class="icon">🤖</span>
    <span class="label">Auto Solver</span>
    <span class="check">✓</span>
  `;
	autoItem.addEventListener("click", (e) => {
		e.stopPropagation();
		currentMode = "auto";
		chrome.storage.local.set({ solverMode: "auto" });
		updateBadgeModeIndicator();
		dropdown.classList.remove("show");
	});
	const assistItem = document.createElement("div");
	assistItem.id = "wordle-solver-item-assist";
	assistItem.className = `wordle-solver-dropdown-item${currentMode === "assist" ? " active" : ""}`;
	assistItem.innerHTML = `
    <span class="icon">🤝</span>
    <span class="label">Assist Mode</span>
    <span class="check">✓</span>
  `;
	assistItem.addEventListener("click", (e) => {
		e.stopPropagation();
		currentMode = "assist";
		chrome.storage.local.set({ solverMode: "assist" });
		updateBadgeModeIndicator();
		dropdown.classList.remove("show");
	});
	dropdown.appendChild(autoItem);
	dropdown.appendChild(assistItem);
	menuBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		dropdown.classList.toggle("show");
	});
	badge.addEventListener("click", () => {
		if (!activeAdapter) {
			updateBadge("⚠️ Unsupported Site");
			return;
		}
		chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
			if (chrome.runtime.lastError) {
				console.error("Failed to get state:", chrome.runtime.lastError);
				return;
			}
			if (response?.success && response.data) if (response.data.isRunning) chrome.runtime.sendMessage({ type: "STOP_SOLVER" });
			else {
				if (currentMode === "assist") updateBadge("🧠 Thinking...");
				chrome.runtime.sendMessage({
					type: "START_SOLVER",
					mode: currentMode
				}, (startResponse) => {
					if (chrome.runtime.lastError) {
						console.error("Failed to start solver from badge:", chrome.runtime.lastError);
						updateBadgeModeIndicator();
						return;
					}
					if (!startResponse?.success) {
						console.error("Failed to start solver from badge:", startResponse?.error);
						updateBadgeModeIndicator();
					} else if (currentMode === "assist") chrome.runtime.sendMessage({ type: "GET_STATE" }, (stateResponse) => {
						if (stateResponse?.success && stateResponse.data) {
							const state = stateResponse.data;
							if (state.currentGuess) {
								updateBadge(`💡 Rec: ${state.currentGuess}`);
								startAssistLoop(state.currentRow);
							} else updateBadge("💡 No Rec");
						}
					});
				});
			}
		});
	});
	document.addEventListener("click", (e) => {
		if (!e.composedPath().includes(wrapper)) dropdown.classList.remove("show");
	});
	wrapper.appendChild(badge);
	wrapper.appendChild(menuBtn);
	wrapper.appendChild(dropdown);
	shadowRoot.appendChild(wrapper);
	return badge;
}
function updateBadge(text) {
	let badge = getShadowElement("wordle-solver-badge");
	if (!badge) {
		createStatusBadge();
		badge = getShadowElement("wordle-solver-badge");
	}
	if (badge) badge.textContent = text;
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	const handler = async () => {
		if (!activeAdapter) {
			if (message.type === "PING") sendResponse({
				success: true,
				isSupported: false,
				error: "Unsupported Website"
			});
			else sendResponse({
				success: false,
				error: "Unsupported Website: This Wordle variant is not supported yet."
			});
			return;
		}
		switch (message.type) {
			case "GET_GAME_INFO":
				sendResponse({
					success: true,
					gameInfo: activeAdapter.info
				});
				break;
			case "READ_BOARD": {
				const boardIdx = message.boardIndex || 0;
				sendResponse({
					success: true,
					data: activeAdapter.readBoard(boardIdx),
					gameInfo: activeAdapter.info
				});
				break;
			}
			case "READ_ALL_BOARDS":
				sendResponse({
					success: true,
					data: activeAdapter.readAllBoards(),
					gameInfo: activeAdapter.info
				});
				break;
			case "TYPE_WORD":
			case "SUBMIT_GUESS": {
				const delay = message.delay ?? typingDelay;
				await activeAdapter.submitGuess(message.word || "", delay);
				sendResponse({ success: true });
				break;
			}
			case "WAIT_REVEAL":
				try {
					const boardIdx = message.boardIndex || 0;
					sendResponse({
						success: true,
						data: await activeAdapter.waitForReveal(boardIdx, message.row)
					});
				} catch (err) {
					sendResponse({
						success: false,
						error: String(err)
					});
				}
				break;
			case "RESET_GAME":
				if (activeAdapter.reset) await activeAdapter.reset();
				sendResponse({ success: true });
				break;
			case "SET_TYPING_DELAY":
				typingDelay = message.delay ?? DEFAULT_TYPING_DELAY;
				sendResponse({ success: true });
				break;
			case "UPDATE_BADGE":
				updateBadge(message.text);
				sendResponse({ success: true });
				break;
			case "PING":
				sendResponse({
					success: true,
					data: "pong",
					isSupported: true,
					gameInfo: activeAdapter.info
				});
				break;
			default: sendResponse({
				success: false,
				error: `Unknown message type: ${message.type}`
			});
		}
	};
	handler();
	return true;
});
if (window.location.hostname.includes("localhost") || window.location.hostname.includes("vercel.app") || window.location.pathname.endsWith("/check")) {
	document.documentElement.dataset.wordleEntropySolverInstalled = "true";
	window.dispatchEvent(new CustomEvent("WORDLE_SOLVER_INSTALLED"));
} else {
	createStatusBadge();
	chrome.storage.local.get(["solverMode"], (result) => {
		if (chrome.runtime.lastError) return;
		if (result.solverMode === "auto" || result.solverMode === "assist") {
			currentMode = result.solverMode;
			updateBadgeModeIndicator();
		}
	});
}
//#endregion
