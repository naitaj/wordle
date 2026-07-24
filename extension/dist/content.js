//#region extension/src/content/selectors.ts
/**
* Selector Abstraction Layer for NYT Wordle and Wordle Unlimited DOM.
* When either site changes their DOM structure, only this file needs updating.
* 
* Strategy: Use data attributes and custom elements (stable) over CSS class names (hashed/unstable).
*/
var SELECTORS = {
	tileByState: "[data-state]",
	keyButton: "button[data-key]",
	row: "[role=\"group\"][aria-label*=\"Row\"]",
	boardFallback: "[class*=\"Board-module\"]",
	rowFallback: "[class*=\"Row-module\"]",
	tileFallback: "[class*=\"Tile-module\"]"
};
var DATA_ATTRS = {
	tileState: "data-state",
	tileLetter: "data-letter",
	keyData: "data-key"
};
var TILE_STATES = {
	empty: "empty",
	tbd: "tbd",
	correct: "correct",
	present: "present",
	absent: "absent"
};
/**
* Detect if we are currently running on wordleunlimited.org.
*/
function isWordleName() {
	return window.location.hostname.includes("wordleunlimited.org");
}
/**
* Find all game tiles in the DOM.
* Returns them in order: row 0 tile 0, row 0 tile 1, ..., row 5 tile 4 (30 total).
*/
function findAllTiles() {
	if (isWordleName()) {
		const gameApp = document.querySelector("game-app");
		if (!gameApp || !gameApp.shadowRoot) return [];
		const gameRows = Array.from(gameApp.shadowRoot.querySelectorAll("game-row"));
		const tiles = [];
		for (const row of gameRows) if (row.shadowRoot) {
			const rowTiles = Array.from(row.shadowRoot.querySelectorAll("game-tile"));
			tiles.push(...rowTiles);
		}
		return tiles;
	}
	let tiles = Array.from(document.querySelectorAll(SELECTORS.tileByState));
	tiles = tiles.filter((el) => el.tagName !== "BUTTON");
	if (tiles.length === 30) return tiles;
	tiles = Array.from(document.querySelectorAll(SELECTORS.tileFallback));
	if (tiles.length === 30) return tiles;
	const allDivs = document.querySelectorAll("div");
	for (const div of allDivs) if (div.children.length === 6) {
		let isBoard = true;
		for (const child of div.children) if (child.children.length !== 5) {
			isBoard = false;
			break;
		}
		if (isBoard) return Array.from(div.querySelectorAll(":scope > * > *"));
	}
	return tiles;
}
/**
* Get tile state from a DOM element.
*/
function getTileState(tile) {
	if (isWordleName()) {
		const evaluation = tile.getAttribute("evaluation");
		if (evaluation) return evaluation;
		const letter = tile.getAttribute("letter");
		if (letter && letter !== "null" && letter !== "") return TILE_STATES.tbd;
		return TILE_STATES.empty;
	}
	return tile.getAttribute(DATA_ATTRS.tileState) || TILE_STATES.empty;
}
/**
* Get tile letter from a DOM element.
*/
function getTileLetter(tile) {
	if (isWordleName()) {
		const letter = tile.getAttribute("letter");
		return (letter && letter !== "null" ? letter : "").toUpperCase();
	}
	return (tile.getAttribute(DATA_ATTRS.tileLetter) || tile.textContent?.trim() || "").toUpperCase();
}
//#endregion
//#region extension/src/content/content.ts
var DEFAULT_TYPING_DELAY = 120;
var typingDelay = DEFAULT_TYPING_DELAY;
function readBoardState() {
	const tiles = findAllTiles();
	const rows = [];
	for (let r = 0; r < 6; r++) {
		const row = [];
		for (let c = 0; c < 5; c++) {
			const tile = tiles[r * 5 + c];
			if (tile) row.push({
				letter: getTileLetter(tile),
				state: getTileState(tile)
			});
			else row.push({
				letter: "",
				state: TILE_STATES.empty
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
		if (isEmpty || hasTbd) {
			currentRow = r;
			break;
		}
		if (!isEvaluated) {
			currentRow = r;
			break;
		}
	}
	let gameStatus = "playing";
	try {
		if (window.location.hostname.includes("wordleunlimited.org")) {
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
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function simulateKeyPress(key) {
	const isEnter = key === "Enter";
	const isBackspace = key === "Backspace";
	const keyUpper = key.toUpperCase();
	const eventInit = {
		key,
		code: isEnter ? "Enter" : isBackspace ? "Backspace" : `Key${keyUpper}`,
		keyCode: isEnter ? 13 : isBackspace ? 8 : keyUpper.charCodeAt(0),
		which: isEnter ? 13 : isBackspace ? 8 : keyUpper.charCodeAt(0),
		bubbles: true,
		cancelable: true
	};
	const keydownEvent = new KeyboardEvent("keydown", eventInit);
	document.dispatchEvent(keydownEvent);
	if (!isBackspace) {
		const keypressEvent = new KeyboardEvent("keypress", eventInit);
		document.dispatchEvent(keypressEvent);
	}
	const keyupEvent = new KeyboardEvent("keyup", eventInit);
	document.dispatchEvent(keyupEvent);
}
async function typeWord(word, delay) {
	for (const letter of word.toLowerCase()) {
		simulateKeyPress(letter);
		await sleep(delay);
	}
}
async function submitGuess() {
	simulateKeyPress("Enter");
}
function isRowInvalid(rowIndex) {
	let rows = [];
	const gameApp = document.querySelector("game-app");
	if (gameApp?.shadowRoot) rows = Array.from(gameApp.shadowRoot.querySelectorAll("game-row"));
	else rows = Array.from(document.querySelectorAll("game-row"));
	if (rows[rowIndex]?.hasAttribute("invalid")) return true;
	const nytRows = document.querySelectorAll("[role=\"group\"][aria-label*=\"Row\"]");
	if (nytRows[rowIndex]) {
		const className = nytRows[rowIndex].className.toLowerCase();
		if (className.includes("invalid") || className.includes("shake")) return true;
	}
	const toasts = Array.from(document.querySelectorAll("game-toast, [class*=\"toast\"]"));
	for (const toast of toasts) {
		const text = toast.textContent?.toLowerCase() || "";
		if (text.includes("not in word list") || text.includes("not in") || text.includes("invalid")) return true;
	}
	return false;
}
async function clearInvalidGuess() {
	for (let i = 0; i < 5; i++) {
		simulateKeyPress("Backspace");
		await sleep(60);
	}
}
function waitForReveal(rowIndex) {
	return new Promise((resolve, reject) => {
		const checkInterval = setInterval(() => {
			if (isRowInvalid(rowIndex)) {
				clearInterval(checkInterval);
				clearTimeout(timeout);
				observer.disconnect();
				clearInvalidGuess().then(() => {
					reject(/* @__PURE__ */ new Error("NOT_IN_WORD_LIST"));
				});
			}
		}, 150);
		const timeout = setTimeout(() => {
			clearInterval(checkInterval);
			observer.disconnect();
			const results = readRowResults(rowIndex);
			if (results) resolve(results);
			else reject(/* @__PURE__ */ new Error("Tile reveal timeout"));
		}, 5e3);
		const rowTiles = findAllTiles().slice(rowIndex * 5, rowIndex * 5 + 5);
		const existing = readRowResults(rowIndex);
		if (existing) {
			clearInterval(checkInterval);
			clearTimeout(timeout);
			resolve(existing);
			return;
		}
		const observer = new MutationObserver(() => {
			const results = readRowResults(rowIndex);
			if (results) {
				clearInterval(checkInterval);
				clearTimeout(timeout);
				observer.disconnect();
				resolve(results);
			}
		});
		const attributeFilter = [
			"data-state",
			"evaluation",
			"reveal"
		];
		for (const tile of rowTiles) observer.observe(tile, {
			attributes: true,
			attributeFilter
		});
		if (rowTiles[0]?.parentElement) observer.observe(rowTiles[0].parentElement, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter
		});
	});
}
function readRowResults(rowIndex) {
	const rowTiles = findAllTiles().slice(rowIndex * 5, rowIndex * 5 + 5);
	const results = [];
	for (const tile of rowTiles) {
		const state = getTileState(tile);
		const letter = getTileLetter(tile);
		if (state === "correct" || state === "present" || state === "absent") results.push({
			letter,
			state
		});
		else return null;
	}
	return results.length === 5 ? results : null;
}
var currentMode = "auto";
var assistLoopActive = false;
async function startAssistLoop(startRow) {
	if (assistLoopActive) return;
	assistLoopActive = true;
	let r = startRow;
	while (currentMode === "assist" && r < 6) try {
		await waitForReveal(r);
		await sleep(300);
		if (currentMode !== "assist") break;
		updateBadge("🧠 Thinking...");
		if ((await new Promise((resolve) => {
			chrome.runtime.sendMessage({
				type: "START_SOLVER",
				mode: "assist"
			}, (res) => {
				if (chrome.runtime.lastError) resolve({
					success: false,
					error: chrome.runtime.lastError.message
				});
				else resolve(res);
			});
		}))?.success) {
			const stateResponse = await new Promise((resolve) => {
				chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
					if (chrome.runtime.lastError) resolve({ success: false });
					else resolve(res);
				});
			});
			if (stateResponse?.success && stateResponse.data) {
				const state = stateResponse.data;
				if (state.currentGuess) updateBadge(`💡 Rec: ${state.currentGuess}`);
				else updateBadge("💡 No Rec");
				r = state.currentRow;
			} else break;
		} else break;
	} catch (err) {
		if (err.message === "NOT_IN_WORD_LIST") continue;
		await sleep(1e3);
	}
	assistLoopActive = false;
}
function updateBadgeModeIndicator() {
	const badge = document.getElementById("wordle-solver-badge");
	if (badge) {
		const txt = badge.textContent || "";
		if (txt === "🧠 Solver Ready" || txt === "🤝 Assist Ready" || txt.startsWith("💡 Rec:") || txt === "💡 No Rec" || txt === "🧠 Thinking...") badge.textContent = currentMode === "auto" ? "🧠 Solver Ready" : "🤝 Assist Ready";
	}
	const autoItem = document.getElementById("wordle-solver-item-auto");
	const assistItem = document.getElementById("wordle-solver-item-assist");
	if (autoItem && assistItem) if (currentMode === "auto") {
		autoItem.classList.add("active");
		assistItem.classList.remove("active");
	} else {
		autoItem.classList.remove("active");
		assistItem.classList.add("active");
	}
}
function createStatusBadge() {
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
		if (!wrapper.contains(e.target)) dropdown.classList.remove("show");
	});
	wrapper.appendChild(badge);
	wrapper.appendChild(menuBtn);
	wrapper.appendChild(dropdown);
	document.body.appendChild(wrapper);
	return badge;
}
function updateBadge(text) {
	let badge = document.getElementById("wordle-solver-badge");
	if (!badge) badge = createStatusBadge();
	badge.textContent = text;
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	const handler = async () => {
		switch (message.type) {
			case "START_ASSIST_LOOP":
				startAssistLoop(message.currentRow);
				sendResponse({ success: true });
				break;
			case "READ_BOARD":
				sendResponse({
					success: true,
					data: readBoardState()
				});
				break;
			case "TYPE_WORD": {
				const delay = message.delay ?? typingDelay;
				await typeWord(message.word, delay);
				sendResponse({ success: true });
				break;
			}
			case "SUBMIT_GUESS":
				await submitGuess();
				sendResponse({ success: true });
				break;
			case "WAIT_REVEAL":
				try {
					sendResponse({
						success: true,
						data: await waitForReveal(message.row)
					});
				} catch (err) {
					sendResponse({
						success: false,
						error: String(err)
					});
				}
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
					data: "pong"
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
console.log("[Wordle Solver] Content script loaded on", window.location.href);
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
