// ==============================
// State
// ==============================

// Key used for storing app state in localStorage
const STORAGE_KEY = "notebook_app_state_v1";

// Application state object
let state = {
  folders: [],            // Array of folder objects
  notes: [],              // Array of note objects
  currentNoteId: null,    // ID of the currently selected note
  darkMode: false         // Boolean for theme (dark/light)
};

// ==============================
// DOM Elements
// ==============================

// Sidebar lists for pinned notes, folders, and notes (root level)
const pinnedList   = document.getElementById("pinnedList");   // UL for pinned notes
const foldersList  = document.getElementById("foldersList");  // UL for folders
const notesList    = document.getElementById("notesList");    // UL for all notes

// Note editor fields and preview
const noteTitleInput   = document.getElementById("noteTitleInput");   // Input for note title
const noteContentInput = document.getElementById("noteContentInput"); // Textarea for note content
const previewArea      = document.getElementById("previewArea");      // Div for HTML preview
const autosaveStatus   = document.getElementById("autosaveStatus");   // Span for autosave message

// Toolbar & actions
const newNoteBtn    = document.getElementById("newNoteBtn");    // Button to create a new note
const newFolderBtn  = document.getElementById("newFolderBtn");  // Button to create a new folder
const deleteNoteBtn = document.getElementById("deleteNoteBtn"); // Button to delete current note
const pinToggleBtn  = document.getElementById("pinToggleBtn");  // Button to pin/unpin note
const moveNoteBtn   = document.getElementById("moveNoteBtn");   // Button to move note to folder

// Search and sort controls
const searchInput = document.getElementById("searchInput"); // Input for searching notes
const sortSelect  = document.getElementById("sortSelect");  // Dropdown for sorting notes

// Export/Import backup controls
const exportBtn   = document.getElementById("exportBtn");   // Button to export state as JSON
const importInput = document.getElementById("importInput"); // Input (file) for importing JSON

// Theme toggle button (dark/light)
const themeToggle = document.getElementById("themeToggle"); // Button to switch theme

// Toolbar markdown formatting buttons
const toolbarButtons = document.querySelectorAll(".toolbar [data-md]"); // NodeList for toolbar

// ==============================
// Helpers
// ==============================

// Generate unique ID for notes or folders (with optional prefix)
function generateId(prefix = "id") {
  // Concatenate prefix, timestamp, and random string
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Save the current state to localStorage
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); // Save as string
  autosaveStatus.textContent = "ذخیره شده"; // Show saved status
}

// Load the state from localStorage (if any)
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY); // Get string
  if (!raw) return; // If nothing, don’t load

  try {
    const parsed = JSON.parse(raw); // Try to parse JSON
    // Validate and assign parsed state (fallbacks)
    state = {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      currentNoteId: parsed.currentNoteId || null,
      darkMode: !!parsed.darkMode
    };

  } catch (err) {
    // Error handling for invalid JSON
    console.error("خطا در خواندن state:", err);
  }
}

// Return currently selected note object, or null
function getCurrentNote() {
  return state.notes.find(note => note.id === state.currentNoteId) || null;
}

// Format a timestamp to the Persian locale string (date+time)
function formatDate(ts) {
  return new Date(ts).toLocaleString("fa-IR");
}

// Escape a string for HTML display (prevent XSS)
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")  // ampersand
    .replaceAll("<", "&lt;")   // less than
    .replaceAll(">", "&gt;");  // greater than
}

// ==============================
// Markdown Parser
// ==============================

// Convert Markdown-formatted text to HTML for preview display
function markdownToHtml(md) {
  if (!md) return ""; // Empty input returns blank

  let html = escapeHtml(md); // Escape for HTML

  // Convert code blocks
  html = html.replace(/([\s\S]*?)/g, (_, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Convert inline code (`code`)
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Convert headings (#, ##, ###)
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // Convert blockquotes (> quote)
  html = html.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");

  // Convert bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert italic (*text*)
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert underline (__text__)
  html = html.replace(/__(.*?)__/g, "<u>$1</u>");

  // Convert markdown links [label](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Convert unordered lists (- item)
  html = html.replace(/(?:^- (.*)\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map(line => line.replace(/^- (.*)/, "<li>$1</li>"))
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Convert ordered lists (1. item)
  html = html.replace(/(?:^\d+\. (.*)\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map(line => line.replace(/^\d+\. (.*)/, "<li>$1</li>"))
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Convert double newlines to paragraph <p> blocks
  html = html
    .split(/\n{2,}/)
    .map(block => {
      // If block already starts with block-level HTML, don’t wrap in <p>
      if (
        block.startsWith("<h1>") ||
        block.startsWith("<h2>") ||
        block.startsWith("<h3>") ||
        block.startsWith("<ul>") ||
        block.startsWith("<ol>") ||
        block.startsWith("<pre>") ||
        block.startsWith("<blockquote>")
      ) {
        return block;
      }
      // Otherwise wrap and convert linebreaks
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}

// Update previewArea div with HTML preview of current note
function updatePreview() {
  const note = getCurrentNote();
  if (!note) {
    // If no note, display message
    previewArea.innerHTML = "<p>یادداشتی انتخاب نشده است.</p>";
    return;
  }
  // Preview markdown
  previewArea.innerHTML = markdownToHtml(note.content || "");
}

// ==============================
// Render Sidebar
// ==============================

// Filter and sort notes based on search and sort controls
function getFilteredAndSortedNotes() {
  const q = searchInput.value.trim().toLowerCase(); // Query
  let filtered = [...state.notes];                  // Start with all notes

  // Filter if query exists (title/content)
  if (q) {
    filtered = filtered.filter(note => {
      const title = (note.title || "").toLowerCase();
      const content = (note.content || "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }

  // Sort notes based on selected option
  const sortValue = sortSelect.value;
  filtered.sort((a, b) => {
    switch (sortValue) {
      case "title-asc":     return (a.title || "").localeCompare((b.title || ""), "fa");
      case "title-desc":    return (b.title || "").localeCompare((a.title || ""), "fa");
      case "created-asc":   return a.createdAt - b.createdAt;
      case "created-desc":  return b.createdAt - a.createdAt;
      case "updated-asc":   return a.updatedAt - b.updatedAt;
      case "updated-desc":
      default:              return b.updatedAt - a.updatedAt;
    }
  });

  return filtered;
}

// Create a clickable sidebar note list item (for given note)
function createNoteListItem(note) {
  const li = document.createElement("li");      // List item element
  li.className = "item";                        // Set class

  if (note.id === state.currentNoteId)          // Active note highlighting
    li.classList.add("active");

  // Title span (truncated style)
  const titleSpan = document.createElement("span");
  titleSpan.textContent = note.title || "یادداشت بدون عنوان";
  titleSpan.style.flex = "1";
  titleSpan.style.overflow = "hidden";
  titleSpan.style.textOverflow = "ellipsis";
  titleSpan.style.whiteSpace = "nowrap";

  // Meta icon (pin indicator)
  const meta = document.createElement("small");
  meta.textContent = note.pinned ? "📌" : "";

  li.appendChild(titleSpan);
  li.appendChild(meta);

  // Click handler: selects the note
  li.addEventListener("click", () => {
    state.currentNoteId = note.id;
    saveState();
    renderAll();
  });

  return li;
}

// Render the sidebar lists (pinned, folders, notes)
function renderSidebar() {
  // Empty all lists before rendering
  pinnedList.innerHTML = "";
  foldersList.innerHTML = "";
  notesList.innerHTML = "";

  // Get filtered/sorted notes for sidebar
  const notes = getFilteredAndSortedNotes();

  // ----- Pinned Notes -----
  notes.filter(n => n.pinned).forEach(note => {
    pinnedList.appendChild(createNoteListItem(note));
  });

  // ----- Folders -----
  state.folders.forEach(folder => {
    const li = document.createElement("li");
    li.className = "item";

    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    // Count notes in this folder
    const folderNotesCount =
      state.notes.filter(n => n.folderId === folder.id).length;

    // Folder title with actions
    li.innerHTML = `
      <span style="flex:1; cursor:pointer;">📁 ${folder.name} (${folderNotesCount})</span>
      <div class="folder-actions">
        <button onclick="renameFolder('${folder.id}')">✏️</button>
        <button onclick="deleteFolder('${folder.id}')">🗑️</button>
      </div>
    `;

    // Click handler for filtering by folder (shows only that folder’s notes)
    li.querySelector("span").addEventListener("click", () => {
      const folderNotes =
        getFilteredAndSortedNotes().filter(n => n.folderId === folder.id);

      notesList.innerHTML = "";
      folderNotes.forEach(note =>
        notesList.appendChild(createNoteListItem(note))
      );
    });

    foldersList.appendChild(li);
  });

  // ----- Notes without folder -----
  notes.filter(n => !n.folderId).forEach(note => {
    notesList.appendChild(createNoteListItem(note));
  });
}

// ==============================
// Render Editor
// ==============================

// Render note editor fields and preview for selected note
function renderEditor() {
  const note = getCurrentNote();

  if (!note) {
    // No note selected: clear and disable
    noteTitleInput.value = "";
    noteContentInput.value = "";
    previewArea.innerHTML = "<p>یادداشتی انتخاب نشده است.</p>";
    noteTitleInput.disabled   = true;
    noteContentInput.disabled = true;
    deleteNoteBtn.disabled    = true;
    pinToggleBtn.disabled     = true;
    moveNoteBtn.disabled      = true;
    return;
  }

  // Fill fields and enable editing
  noteTitleInput.disabled   = false;
  noteContentInput.disabled = false;
  deleteNoteBtn.disabled    = false;
  pinToggleBtn.disabled     = false;
  moveNoteBtn.disabled      = false;

  noteTitleInput.value = note.title || "";
  noteContentInput.value = note.content || "";
  pinToggleBtn.textContent = note.pinned ? "📌 پین‌شده" : "📌"; // Pin indicator

  updatePreview();
}

// ==============================
// Render Theme
// ==============================

// Apply theme class and toggle button text
function renderTheme() {
  document.body.classList.toggle("dark", state.darkMode); // Add/remove theme
  themeToggle.textContent = state.darkMode ? "حالت روشن" : "حالت تاریک";
}

// ==============================
// Render All
// ==============================

// Render theme, sidebar, and editor together
function renderAll() {
  renderTheme();
  renderSidebar();
  renderEditor();
}

// ==============================
// CRUD Notes
// ==============================

// Create and select a new note
function createNewNote() {
  const now = Date.now(); // Get current timestamp

  // New note object
  const note = {
    id: generateId("note"),
    title: "یادداشت جدید",
    content: "",
    pinned: false,
    folderId: null,
    createdAt: now,
    updatedAt: now
  };

  state.notes.unshift(note);        // Add to start of notes array
  state.currentNoteId = note.id;    // Select this note

  saveState();
  renderAll();
}

// Delete the currently selected note
function deleteCurrentNote() {
  const note = getCurrentNote();
  if (!note) return;

  // Confirm deletion with user
  if (!confirm(`آیا از حذف "${note.title}" مطمئن هستید؟`)) return;

  state.notes = state.notes.filter(n => n.id !== note.id); // Remove note

  // Select next note (or none)
  state.currentNoteId = state.notes[0]?.id || null;

  saveState();
  renderAll();
}

// Toggle pin status for current note
function togglePinCurrentNote() {
  const note = getCurrentNote();
  if (!note) return;

  note.pinned = !note.pinned;          // Toggle pin
  note.updatedAt = Date.now();         // Update timestamp

  saveState();
  renderAll();
}

// Move current note to a selected folder
function moveCurrentNoteToFolder() {
  const note = getCurrentNote();
  if (!note) return;

  if (state.folders.length === 0) {
    alert("ابتدا یک پوشه بسازید.");
    return;
  }

  // User prompt for folder selection (numbered)
  let message = "شماره پوشه را وارد کنید:\n0) بدون پوشه\n";
  state.folders.forEach((folder, i) => {
    message += `${i + 1}) ${folder.name}\n`;
  });

  const input = prompt(message, "0");
  if (input === null) return;

  const index = Number(input);
  // Validate selection
  if (isNaN(index) || index < 0 || index > state.folders.length) {
    alert("انتخاب نامعتبر است.");
    return;
  }

  // Assign folder or remove folder assignment
  note.folderId = index === 0 ? null : state.folders[index - 1].id;
  note.updatedAt = Date.now();

  saveState();
  renderAll();
}

// ==============================
// CRUD Folders
// ==============================

// Create a new folder and add to state
function createNewFolder() {
  const name = prompt("نام پوشه را وارد کنید:");
  if (!name?.trim()) return;

  // New folder object
  state.folders.push({
    id: generateId("folder"),
    name: name.trim(),
    createdAt: Date.now()
  });

  saveState();
  renderAll();
}

// Delete a folder and ungroup all notes inside it
function deleteFolder(folderId) {
  const folder = state.folders.find(f => f.id === folderId);
  if (!folder) return;

  // Confirm deletion
  if (!confirm(`حذف پوشه "${folder.name}"؟`)) return;

  // Remove folder from state
  state.folders = state.folders.filter(f => f.id !== folderId);

  // Remove folder reference from notes
  state.notes.forEach(n => {
    if (n.folderId === folderId) n.folderId = null;
  });

  saveState();
  renderAll();
}

// Rename a folder by ID
function renameFolder(folderId) {
  const folder = state.folders.find(f => f.id === folderId);
  if (!folder) return;

  const newName = prompt("نام جدید:", folder.name);
  if (!newName?.trim()) return;

  folder.name = newName.trim();

  saveState();
  renderAll();
}

// ==============================
// Input Events
// ==============================

// Handler for title input typing
noteTitleInput.addEventListener("input", () => {
  const note = getCurrentNote();
  if (!note) return;

  note.title = noteTitleInput.value;         // Update state
  note.updatedAt = Date.now();               // Update timestamp

  autosaveStatus.textContent = "در حال ذخیره..."; // Status
  saveState();
  renderSidebar(); // Update sidebar title immediately
});

// Handler for content input typing
noteContentInput.addEventListener("input", () => {
  const note = getCurrentNote();
  if (!note) return;

  note.content = noteContentInput.value;     // Update state
  note.updatedAt = Date.now();               // Update timestamp

  autosaveStatus.textContent = "در حال ذخیره..."; // Status
  saveState();
  updatePreview();   // Show live preview
  renderSidebar();   // Reflect changes in sidebar
});

// ==============================
// Search / Sort
// ==============================

// Listen for search input changes
searchInput.addEventListener("input", renderSidebar);

// Listen for sort selection changes
sortSelect.addEventListener("change", renderSidebar);

// ==============================
// Buttons
// ==============================

// Create note button
newNoteBtn.addEventListener("click", createNewNote);

// Create folder button
newFolderBtn.addEventListener("click", createNewFolder);

// Delete note button
deleteNoteBtn.addEventListener("click", deleteCurrentNote);

// Pin button (toggle)
pinToggleBtn.addEventListener("click", togglePinCurrentNote);

// Move note button
moveNoteBtn.addEventListener("click", moveCurrentNoteToFolder);

// Theme toggle button
themeToggle.addEventListener("click", () => {
  state.darkMode = !state.darkMode; // Toggle dark/light
  saveState();
  renderTheme();
});

// ==============================
// Export / Import
// ==============================

// Export notes/folders as JSON file
exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(state, null, 2);      // Format data
  const blob = new Blob([dataStr], { type: "application/json" }); // Make blob
  const url = URL.createObjectURL(blob);                // Create URL

  // Create download link and trigger download
  const a = document.createElement("a");
  a.href = url;
  a.download = "notebook-backup.json";
  a.click();

  URL.revokeObjectURL(url); // Clean up
});

// Import JSON backup file
importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  // On file load
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);

      // Validate structure before replacing state
      state = {
        folders: Array.isArray(imported.folders) ? imported.folders : [],
        notes: Array.isArray(imported.notes) ? imported.notes : [],
        currentNoteId: imported.currentNoteId || null,
        darkMode: !!imported.darkMode
      };

      saveState();
      renderAll();
      alert("ورود اطلاعات با موفقیت انجام شد.");

    } catch (err) {
      alert("فایل JSON معتبر نیست.");
    }
  };

  reader.readAsText(file);
});

// ==============================
// Toolbar Markdown
// ==============================

// Wrap selected text with specified Markdown markers
function wrapSelectedText(before, after = before, placeholder = "متن") {
  const start = noteContentInput.selectionStart;
  const end   = noteContentInput.selectionEnd;
  const value = noteContentInput.value;

  // Use placeholder if nothing selected
  const selected = value.slice(start, end) || placeholder;
  const newText = before + selected + after;

  // Insert wrapped text at cursor position
  noteContentInput.value =
    value.slice(0, start) + newText + value.slice(end);

  noteContentInput.focus();
  noteContentInput.setSelectionRange(
    start + before.length,
    start + before.length + selected.length
  );

  // Update note state
  const note = getCurrentNote();
  if (note) {
    note.content = noteContentInput.value;
    note.updatedAt = Date.now();
    saveState();
    updatePreview();
    renderSidebar();
  }
}

// Insert Markdown prefix at start of lines (lists, headings)
function insertAtLineStart(prefix) {
  const start = noteContentInput.selectionStart;
  const end   = noteContentInput.selectionEnd;

  const value = noteContentInput.value;
  const selected = value.slice(start, end) || "آیتم";

  // Apply prefix to each selected line
  const lines = selected
    .split("\n")
    .map(line => prefix + line)
    .join("\n");

  // Insert prefixed lines
  noteContentInput.value =
    value.slice(0, start) + lines + value.slice(end);

  noteContentInput.focus();

  // Update note state
  const note = getCurrentNote();
  if (note) {
    note.content = noteContentInput.value;
    note.updatedAt = Date.now();
    saveState();
    updatePreview();
    renderSidebar();
  }
}

// Event handlers for toolbar Markdown buttons
toolbarButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.md; // Read action type

    // Select action for button
    switch (type) {
      case "bold":      wrapSelectedText("**", "**", "متن ضخیم"); break;
      case "italic":    wrapSelectedText("*", "*", "متن مورب");  break;
      case "underline": wrapSelectedText("__", "__", "متن زیرخط"); break;
      case "link":      wrapSelectedText("[", "](https://example.com)", "متن لینک"); break;
      case "code":      wrapSelectedText("`", "`", "code");       break;
      case "codeblock": wrapSelectedText("\n", "\n", "console.log('Hello');"); break;
      case "h1":        insertAtLineStart("# ");                  break;
      case "h2":        insertAtLineStart("## ");                 break;
      case "ul":        insertAtLineStart("- ");                  break;
      case "ol":        insertAtLineStart("1. ");                 break;
    }
  });
});



// Expose folder handlers for use in sidebar action buttons
window.renameFolder = renameFolder;
window.deleteFolder = deleteFolder;
