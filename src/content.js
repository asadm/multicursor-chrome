
var activeEditor;
var activeEditorEl;
function enableOverlay(e) {
	var activeEl = document.activeElement;
	if (activeEl.nodeName === "INPUT" || activeEl.nodeName === "TEXTAREA") {
		addEditor(activeEl, activeEl.nodeName === "TEXTAREA");
		e.preventDefault();
		return false;
	}
}

function addEditor(inputEl, isTextArea) {
	var containerEl = document.createElement("div");
	containerEl.id = "editor_overlay_container";
	var coords = getCoords(inputEl);
	var computedStyle = getComputedStyle(inputEl, null);
	containerEl.style.cssText = `
		position: absolute;
		z-index: 9999;
		top: ${coords.top}px;
		left: ${coords.left}px;
		width: ${coords.right - coords.left}px;
		height: ${coords.bottom - coords.top}px;
		background: "cyan";
		overflow: hidden;
		font-family: ${computedStyle.fontFamily};
		font-size: ${computedStyle.fontSize};
		border: 1px solid #08a2a2;
		border-radius: 3px;
		padding: ${computedStyle.padding};
	`
	document.body.appendChild(containerEl);
	activeEditor = CodeMirror(containerEl, {
		value: inputEl.value,
		mode: "plaintext",
		lineNumbers: false,
		keyMap: "sublime",
		width: `${coords.right - coords.left}px`,
		height: `${coords.bottom - coords.top}px`
	});

	// limit 1 line max if this is INPUT
	if (!isTextArea){
		activeEditor.on("beforeChange", (cm, changeObj) => {
			var typedNewLine = changeObj.origin == '+input' && typeof changeObj.text == "object" && changeObj.text.join("") == "";
			if (typedNewLine) {
				return changeObj.cancel();
			}
	
			var pastedNewLine = changeObj.origin == 'paste' && typeof changeObj.text == "object" && changeObj.text.length > 1;
			if (pastedNewLine) {
				var newText = changeObj.text.join(" ");
				return changeObj.update(null, null, [newText]);
			}
			return null;
		});
	}
	
	activeEditor.on("blur", () => {
		inputEl.value = activeEditor.getValue();
		activeEditorEl.remove();
		activeEditorEl = null;
		activeEditor = null;
	});

	// if user has selected text
	var selectionData = getSelectionLineNumberAndColumnIndex(inputEl);
	activeEditor.setSelection(
		{line: selectionData.startLine, ch: selectionData.startCol}, 
		{line: selectionData.endLine, ch: selectionData.endCol})
	activeEditor.execCommand('selectNextOccurrence');
	activeEditor.focus();
	activeEditorEl = containerEl;
}

function getSelectionLineNumberAndColumnIndex(inputEl){
	var textLines = inputEl.value.substr(0, inputEl.selectionStart).split("\n");
	var startLine = textLines.length;
	var startCol = textLines[textLines.length-1].length;
	
	textLines = inputEl.value.substr(0, inputEl.selectionEnd).split("\n");
	var endLine = textLines.length;
	var endCol = textLines[textLines.length-1].length;
	return {startLine: startLine-1, startCol, endLine: endLine-1, endCol};
}

// get document coordinates of the element
function getCoords(elem) {
	let box = elem.getBoundingClientRect();

	return {
		top: box.top + window.pageYOffset,
		right: box.right + window.pageXOffset,
		bottom: box.bottom + window.pageYOffset,
		left: box.left + window.pageXOffset
	};
}


keyboardJS.bind('ctrl + d', enableOverlay);
keyboardJS.bind('command + d', enableOverlay);