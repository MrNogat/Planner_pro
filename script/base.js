// --- DATA ---
let boardData = {
  title: "My Project",
  templates: [],
  lists: [
    {
      id: "j9aqn2na",
      name: "To Do",
      color: "#ebecf0",
      cards: [
        {
          id: "3qqmckim",
          text: "Setup project structure",
          color: "#0061ff",
          checklists: [
            {
              id: "qbf2wv2r",
              title: "Initial Tasks",
              items: [
                { id: "v8l323ax", text: "Initialize repository", done: true },
                { id: "614sbbqt", text: "Create HTML file", done: true },
              ],
            },
          ],
        },
      ],
    },
  ],
};
let activeModal = { listId: null, cardId: null };
const generateId = () => Math.random().toString(36).substr(2, 8);

// --- RENDER & EDITING ---
function renderBoard() {
  renderEditableTitle(
    document.getElementById("board-title-container"),
    boardData.title,
    updateProjectTitle,
    "h1"
  );
  const boardContainer = document.getElementById("board-container");
  boardContainer.innerHTML = "";
  boardData.lists.forEach((listData) =>
    boardContainer.appendChild(createList(listData))
  );
  boardContainer.appendChild(createAddListControls());
}
function renderEditableTitle(
  container,
  initialText,
  onSave,
  elementType = "span"
) {
  container.innerHTML = "";
  const textElement = document.createElement(elementType);
  textElement.textContent = initialText;
  container.appendChild(textElement);
  container.ondblclick = (e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.className = "inline-edit-input";
    input.value = initialText;
    const save = () => {
      const newText = input.value.trim();
      if (newText) onSave(newText);
      if (document.getElementById("card-modal").style.display === "flex") {
        openCardModal(activeModal.listId, activeModal.cardId);
      } else {
        renderBoard();
      }
    };
    input.onblur = save;
    input.onkeydown = (e) => {
      if (e.key === "Enter") input.blur();
    };
    container.innerHTML = "";
    container.appendChild(input);
    input.focus();
  };
}

// --- LIST & CARD CREATION ---
function createList(listData) {
  const listWrapper = document.createElement("div");
  listWrapper.className = "list-wrapper";
  listWrapper.dataset.listId = listData.id;
  listWrapper.style.backgroundColor = listData.color || "var(--list-bg)";
  listWrapper.addEventListener("dragover", handleCardDragOver);
  listWrapper.addEventListener("drop", handleCardDrop);
  const listHeader = document.createElement("div");
  listHeader.className = "list-header";
  listHeader.draggable = true;
  listHeader.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", listData.id);
    listWrapper.classList.add("list-dragging");
  });
  listHeader.addEventListener("dragend", () =>
    listWrapper.classList.remove("list-dragging")
  );
  const listTitleWrapper = document.createElement("div");
  listTitleWrapper.className = "list-title-wrapper";
  const listTitleContainer = document.createElement("div");
  listTitleContainer.className = "list-title";
  renderEditableTitle(
    listTitleContainer,
    listData.name,
    (newName) => updateListTitle(listData.id, newName),
    "h2"
  );
  const cardCount = document.createElement("span");
  cardCount.className = "card-count";
  cardCount.textContent = listData.cards.length;
  listTitleWrapper.appendChild(listTitleContainer);
  listTitleWrapper.appendChild(cardCount);
  const controls = document.createElement("div");
  controls.className = "list-header-controls";
  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.className = "list-color-picker";
  colorPicker.value = listData.color || "#ebecf0";
  colorPicker.onchange = (e) => updateListColor(listData.id, e.target.value);
  const deleteButton = document.createElement("button");
  deleteButton.className = "action-btn delete-btn";
  deleteButton.innerHTML = "&times;";
  deleteButton.onclick = () => deleteList(listData.id);
  controls.appendChild(colorPicker);
  controls.appendChild(deleteButton);
  listHeader.appendChild(listTitleWrapper);
  listHeader.appendChild(controls);
  const listContent = document.createElement("div");
  listContent.className = "list-content";
  listData.cards.forEach((cardData) =>
    listContent.appendChild(createCard(cardData, listData.id))
  );
  listWrapper.appendChild(listHeader);
  listWrapper.appendChild(listContent);
  listWrapper.appendChild(createAddCardControls(listData.id));
  return listWrapper;
}
function createCard(cardData, listId) {
  const cardElement = document.createElement("div");
  cardElement.className = "card";
  cardElement.dataset.cardId = cardData.id;
  cardElement.draggable = true;
  cardElement.onclick = () => openCardModal(listId, cardData.id);
  cardElement.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ cardId: cardData.id, listId: listId })
    );
    setTimeout(() => cardElement.classList.add("dragging"), 0);
  });
  cardElement.addEventListener("dragend", () =>
    cardElement.classList.remove("dragging")
  );
  if (cardData.color) {
    const colorLabel = document.createElement("div");
    colorLabel.className = "card-color-label";
    colorLabel.style.backgroundColor = cardData.color;
    cardElement.appendChild(colorLabel);
  }
  const cardText = document.createElement("div");
  cardText.className = "card-text";
  cardText.textContent = cardData.text;
  cardElement.appendChild(cardText);
  const { total, done } = calculateChecklistProgress(cardData);
  if (total > 0) {
    const footer = document.createElement("div");
    footer.className = "card-footer";
    const summary = document.createElement("div");
    summary.className = "checklist-summary";
    const isCompleted = done === total;
    summary.style.color = isCompleted
      ? "var(--btn-success)"
      : "var(--text-light)";
    summary.innerHTML = `<span>✔</span> ${done}/${total}`;
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    const innerBar = document.createElement("div");
    innerBar.className = `progress-bar-inner ${isCompleted ? "completed" : ""}`;
    innerBar.style.width = `${(done / total) * 100}%`;
    progressBar.appendChild(innerBar);
    footer.appendChild(summary);
    footer.appendChild(progressBar);
    cardElement.appendChild(footer);
  }
  return cardElement;
}

// --- CARD MODAL ---
function openCardModal(listId, cardId) {
  activeModal = { listId, cardId };
  const cardData = findCard(listId, cardId);
  if (!cardData) return;
  document.getElementById("modal-card-title").value = cardData.text;
  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = "";
  const actionsSection = document.createElement("div");
  actionsSection.className = "modal-section card-actions";
  actionsSection.innerHTML = "<h3>Actions</h3>";
  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.value = cardData.color || "#ffffff";
  colorPicker.onchange = (e) => {
    updateCardColor(listId, cardId, e.target.value);
  };
  const cloneButton = document.createElement("button");
  cloneButton.className = "btn";
  cloneButton.textContent = "Clone";
  cloneButton.onclick = () => {
    cloneCard(listId, cardId);
    closeCardModal();
  };
  const saveTemplateButton = document.createElement("button");
  saveTemplateButton.className = "btn";
  saveTemplateButton.textContent = "Save as Template";
  saveTemplateButton.onclick = () => saveCardAsTemplate(listId, cardId);
  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-danger";
  deleteButton.textContent = "Delete Card";
  deleteButton.onclick = () => deleteCard(listId, cardId);
  actionsSection.appendChild(colorPicker);
  actionsSection.appendChild(cloneButton);
  actionsSection.appendChild(saveTemplateButton);
  actionsSection.appendChild(deleteButton);
  modalBody.appendChild(actionsSection);
  const checklistsSection = document.createElement("div");
  checklistsSection.className = "modal-section";
  checklistsSection.innerHTML = "<h3>Checklists</h3>";
  cardData.checklists.forEach((cl) =>
    checklistsSection.appendChild(createModalChecklist(cl, cardId, listId))
  );
  checklistsSection.appendChild(createAddChecklistControls(cardId, listId));
  modalBody.appendChild(checklistsSection);
  document.getElementById("card-modal").style.display = "flex";
}
function closeCardModal() {
  if (activeModal.cardId && findCard(activeModal.listId, activeModal.cardId)) {
    updateCardTitle(
      activeModal.listId,
      activeModal.cardId,
      document.getElementById("modal-card-title").value
    );
  }
  activeModal = { listId: null, cardId: null };
  document.getElementById("card-modal").style.display = "none";
  renderBoard();
}
function createModalChecklist(checklistData, cardId, listId) {
  const container = document.createElement("div");
  container.className = "modal-checklist";
  const header = document.createElement("div");
  header.className = "modal-checklist-header";
  const titleContainer = document.createElement("div");
  titleContainer.className = "checklist-title-container";
  renderEditableTitle(
    titleContainer,
    checklistData.title,
    (newTitle) =>
      updateChecklistTitle(listId, cardId, checklistData.id, newTitle),
    "h4"
  );
  const progress = document.createElement("span");
  progress.className = "checklist-progress-text";
  const doneItems = checklistData.items.filter((i) => i.done).length;
  progress.textContent = `(${doneItems}/${checklistData.items.length})`;
  const cloneBtn = document.createElement("button");
  cloneBtn.className = "action-btn";
  cloneBtn.innerHTML = "⎘";
  cloneBtn.title = "Clone Checklist";
  cloneBtn.onclick = () => cloneChecklist(listId, cardId, checklistData.id);
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "action-btn delete-btn";
  deleteBtn.innerHTML = "&times;";
  deleteBtn.title = "Delete Checklist";
  deleteBtn.onclick = () => deleteChecklist(listId, cardId, checklistData.id);
  header.appendChild(titleContainer);
  header.appendChild(progress);
  header.appendChild(cloneBtn);
  header.appendChild(deleteBtn);
  container.appendChild(header);
  checklistData.items.forEach((itemData) =>
    container.appendChild(
      createModalChecklistItem(itemData, checklistData.id, cardId, listId)
    )
  );
  container.appendChild(
    createAddChecklistItemControls(checklistData.id, cardId, listId)
  );
  return container;
}
function createModalChecklistItem(itemData, checklistId, cardId, listId) {
  const itemElement = document.createElement("div");
  itemElement.className = "checklist-item" + (itemData.done ? " done" : "");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = itemData.done;
  checkbox.onchange = () => {
    toggleChecklistItem(listId, cardId, checklistId, itemData.id);
    openCardModal(listId, cardId);
  };
  const textContainer = document.createElement("div");
  textContainer.className = "checklist-item-text";
  renderEditableTitle(
    textContainer,
    itemData.text,
    (newText) =>
      updateChecklistItemText(
        listId,
        cardId,
        checklistId,
        itemData.id,
        newText
      ),
    "span"
  );
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "action-btn delete-btn";
  deleteBtn.innerHTML = "&times;";
  deleteBtn.onclick = () =>
    deleteChecklistItem(listId, cardId, checklistId, itemData.id);
  itemElement.appendChild(checkbox);
  itemElement.appendChild(textContainer);
  itemElement.appendChild(deleteBtn);
  return itemElement;
}

// --- TEMPLATE MANAGER MODAL ---
function openTemplateManager() {
  renderTemplateManager();
  document.getElementById("template-manager-modal").style.display = "flex";
}
function closeTemplateManager() {
  document.getElementById("template-manager-modal").style.display = "none";
  renderBoard();
}
function renderTemplateManager() {
  const body = document.getElementById("template-manager-body");
  body.innerHTML = "";
  if (!boardData.templates || boardData.templates.length === 0) {
    body.textContent = "No templates saved yet.";
    return;
  }
  boardData.templates.forEach((template) => {
    const item = document.createElement("div");
    item.className = "template-list-item";
    const name = document.createElement("span");
    name.textContent = template.name;
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteTemplate(template.id);
    item.appendChild(name);
    item.appendChild(delBtn);
    body.appendChild(item);
  });
}

// --- DRAG & DROP HANDLERS ---
function handleCardDragOver(e) {
  e.preventDefault();
}
function handleCardDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  try {
    const { cardId, listId: originListId } = JSON.parse(
      e.dataTransfer.getData("text/plain")
    );
    const targetListId = e.currentTarget.dataset.listId;
    if (!cardId || originListId === targetListId) return;
    const originList = findList(originListId);
    const cardIndex = originList.cards.findIndex((c) => c.id === cardId);
    const [cardData] = originList.cards.splice(cardIndex, 1);
    findList(targetListId).cards.push(cardData);
    renderBoard();
  } catch {}
}
function handleListDrop(e) {
  e.preventDefault();
  const draggedListId = e.dataTransfer.getData("text/plain");
  const placeholder = document.querySelector(".list-placeholder");
  if (!placeholder) return;
  const targetListElement = placeholder.nextElementSibling;
  const targetListId = targetListElement
    ? targetListElement.dataset.listId
    : null;
  const draggedList = findList(draggedListId);
  if (!draggedList) return;
  const oldIndex = boardData.lists.findIndex(
    (list) => list.id === draggedListId
  );
  boardData.lists.splice(oldIndex, 1);
  if (targetListId) {
    const newIndex = boardData.lists.findIndex(
      (list) => list.id === targetListId
    );
    boardData.lists.splice(newIndex, 0, draggedList);
  } else {
    boardData.lists.push(draggedList);
  }
  renderBoard();
}
function handleListDragOver(e) {
  e.preventDefault();
  const placeholder =
    document.querySelector(".list-placeholder") ||
    document.createElement("div");
  placeholder.className = "list-placeholder";
  const draggingList = document.querySelector(".list-dragging");
  if (!draggingList) return;
  const afterElement = getDragAfterElement(e.clientX);
  if (afterElement == null) {
    document.getElementById("board-container").appendChild(placeholder);
  } else {
    document
      .getElementById("board-container")
      .insertBefore(placeholder, afterElement);
  }
}
function getDragAfterElement(x) {
  const draggableElements = [
    ...document.querySelectorAll(".list-wrapper:not(.list-dragging)"),
  ];
  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// --- CONTROL & DATA HELPERS ---
function createAddListControls() {
  const wrapper = document.createElement("div");
  wrapper.className = "list-wrapper add-list-wrapper";
  const input = document.createElement("input");
  input.placeholder = "Enter list title...";
  const button = document.createElement("button");
  button.className = "btn";
  button.textContent = "Add List";
  button.onclick = () => {
    if (input.value.trim()) {
      addList(input.value.trim());
      input.value = "";
    }
  };
  wrapper.appendChild(input);
  wrapper.appendChild(button);
  return wrapper;
}
function createAddCardControls(listId) {
  const container = document.createElement("div");
  container.className = "add-controls";
  const input = document.createElement("input");
  input.placeholder = "Enter card title...";
  const templateSelect = document.createElement("select");
  templateSelect.innerHTML = `<option value="">Or create from template...</option>`;
  if (boardData.templates)
    boardData.templates.forEach(
      (t) =>
        (templateSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`)
    );
  const button = document.createElement("button");
  button.className = "add-btn";
  button.textContent = "Add Card";
  button.onclick = () => {
    const templateId = templateSelect.value;
    const cardText = input.value.trim();
    if (templateId) {
      createCardFromTemplate(listId, templateId);
    } else if (cardText) {
      addCard(listId, cardText);
    }
    input.value = "";
    templateSelect.value = "";
  };
  container.appendChild(input);
  container.appendChild(templateSelect);
  container.appendChild(button);
  return container;
}
const createAddChecklistControls = (cardId, listId) =>
  createAddControls("New checklist title...", "Add Checklist", (title) => {
    addChecklist(listId, cardId, title);
    openCardModal(listId, cardId);
  });
const createAddChecklistItemControls = (clId, cId, lId) =>
  createAddControls("Add an item...", "Add", (text) => {
    addChecklistItem(lId, cId, clId, text);
    openCardModal(lId, cId);
  });
function createAddControls(placeholder, btnText, onAdd) {
  const container = document.createElement("div");
  container.className = "add-controls";
  const input = document.createElement("input");
  input.placeholder = placeholder;
  const button = document.createElement("button");
  button.className = "add-btn";
  button.textContent = btnText;
  button.onclick = () => {
    if (input.value.trim()) {
      onAdd(input.value.trim());
      input.value = "";
    }
  };
  container.appendChild(input);
  container.appendChild(button);
  return container;
}

// --- DATA MANIPULATION (CRUD) ---
const findList = (listId) => boardData.lists.find((l) => l.id === listId);
const findCard = (listId, cardId) =>
  findList(listId)?.cards.find((c) => c.id === cardId);
const findChecklist = (lId, cId, clId) =>
  findCard(lId, cId)?.checklists.find((cl) => cl.id === clId);
function addList(name) {
  boardData.lists.push({ id: generateId(), name, color: "#ebecf0", cards: [] });
  renderBoard();
}
function deleteList(listId) {
  if (confirm("Delete this list and all its cards? This cannot be undone.")) {
    boardData.lists = boardData.lists.filter((l) => l.id !== listId);
    renderBoard();
  }
}
function addCard(listId, text) {
  findList(listId).cards.push({
    id: generateId(),
    text: text,
    color: null,
    checklists: [],
  });
  renderBoard();
}
function deleteCard(listId, cardId) {
  if (confirm("Are you sure you want to delete this card?")) {
    const list = findList(listId);
    list.cards = list.cards.filter((c) => c.id !== cardId);
    closeCardModal();
  }
}
function cloneCard(listId, cardId) {
  const list = findList(listId);
  const cardIndex = list.cards.findIndex((c) => c.id === cardId);
  const newCard = JSON.parse(JSON.stringify(findCard(listId, cardId)));
  newCard.id = generateId();
  newCard.text += " (Copy)";
  newCard.checklists.forEach((cl) => {
    cl.id = generateId();
    cl.items.forEach((item) => (item.id = generateId()));
  });
  list.cards.splice(cardIndex + 1, 0, newCard);
  renderBoard();
}
function addChecklist(lId, cId, title) {
  findCard(lId, cId).checklists.push({ id: generateId(), title, items: [] });
}
function deleteChecklist(lId, cId, clId) {
  if (confirm("Delete this checklist and all its items?")) {
    const card = findCard(lId, cId);
    card.checklists = card.checklists.filter((cl) => cl.id !== clId);
    openCardModal(lId, cId);
  }
}
function cloneChecklist(lId, cId, clId) {
  const card = findCard(lId, cId);
  const checklistIndex = card.checklists.findIndex((cl) => cl.id === clId);
  const newChecklist = JSON.parse(
    JSON.stringify(card.checklists[checklistIndex])
  );
  newChecklist.id = generateId();
  newChecklist.title += " (Copy)";
  newChecklist.items.forEach((item) => (item.id = generateId()));
  card.checklists.splice(checklistIndex + 1, 0, newChecklist);
  openCardModal(lId, cId);
}
function addChecklistItem(lId, cId, clId, text) {
  findChecklist(lId, cId, clId).items.push({
    id: generateId(),
    text,
    done: false,
  });
}
function deleteChecklistItem(lId, cId, clId, itemId) {
  const checklist = findChecklist(lId, cId, clId);
  checklist.items = checklist.items.filter((item) => item.id !== itemId);
  openCardModal(lId, cId);
}
function toggleChecklistItem(lId, cId, clId, itemId) {
  const item = findChecklist(lId, cId, clId)?.items.find(
    (i) => i.id === itemId
  );
  if (item) item.done = !item.done;
}
function updateProjectTitle(newTitle) {
  boardData.title = newTitle;
}
function updateListTitle(listId, newName) {
  findList(listId).name = newName;
}
function updateListColor(listId, color) {
  findList(listId).color = color;
  renderBoard();
}
function updateCardColor(listId, cardId, color) {
  findCard(listId, cardId).color = color;
}
function updateCardTitle(listId, cardId, text) {
  if (findCard(listId, cardId)) findCard(listId, cardId).text = text;
}
function updateChecklistTitle(lId, cId, clId, newTitle) {
  findChecklist(lId, cId, clId).title = newTitle;
}
function updateChecklistItemText(lId, cId, clId, itemId, newText) {
  findChecklist(lId, cId, clId).items.find((item) => item.id === itemId).text =
    newText;
}
const calculateChecklistProgress = (cardData) => {
  let total = 0,
    done = 0;
  if (cardData.checklists)
    cardData.checklists.forEach((cl) => {
      total += cl.items.length;
      done += cl.items.filter((i) => i.done).length;
    });
  return { total, done };
};

// --- TEMPLATE FUNCTIONS ---
function saveCardAsTemplate(listId, cardId) {
  const name = prompt("Enter a name for this template:");
  if (!name || !name.trim()) return;
  const cardData = findCard(listId, cardId);
  const templateData = JSON.parse(JSON.stringify(cardData));
  delete templateData.id;
  if (!boardData.templates) boardData.templates = [];
  boardData.templates.push({
    id: "tpl_" + generateId(),
    name: name.trim(),
    cardData: templateData,
  });
  alert(`Template "${name.trim()}" saved!`);
  renderBoard();
}
function createCardFromTemplate(listId, templateId) {
  const template = boardData.templates.find((t) => t.id === templateId);
  if (!template) return;
  const newCard = JSON.parse(JSON.stringify(template.cardData));
  newCard.id = generateId();
  newCard.checklists.forEach((cl) => {
    cl.id = generateId();
    cl.items.forEach((item) => (item.id = generateId()));
  });
  findList(listId).cards.push(newCard);
  renderBoard();
}
function deleteTemplate(templateId) {
  if (confirm("Are you sure you want to delete this template?")) {
    boardData.templates = boardData.templates.filter(
      (t) => t.id !== templateId
    );
    renderTemplateManager();
  }
}

// --- IMPORT/EXPORT ---
function exportProject() {
  const dataStr = JSON.stringify(boardData, null, 2);
  const link = document.createElement("a");
  link.href =
    "data:application/octet-stream;charset=utf-8," + encodeURIComponent(dataStr);
  link.download = `${boardData.title.replace(/\s/g, "_")}.plnpro`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function importProject(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.lists || !data.title) throw new Error("Invalid format");
      boardData = data;
      if (!boardData.templates) boardData.templates = [];
      renderBoard();
    } catch (error) {
      alert("Error parsing JSON file.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const boardContainer = document.getElementById("board-container");
  boardContainer.addEventListener("dragover", handleListDragOver);
  boardContainer.addEventListener("drop", handleListDrop);
  document.getElementById("export-btn").onclick = exportProject;
  document.getElementById("import-btn").onclick = () =>
    document.getElementById("file-input").click();
  document.getElementById("file-input").onchange = importProject;
  document.getElementById("modal-close-btn").onclick = closeCardModal;
  document.getElementById("card-modal").onclick = (e) => {
    if (e.target === e.currentTarget) closeCardModal();
  };
  document.getElementById("template-manager-btn").onclick = openTemplateManager;
  document.getElementById("template-manager-close-btn").onclick =
    closeTemplateManager;
  document.getElementById("template-manager-modal").onclick = (e) => {
    if (e.target === e.currentTarget) closeTemplateManager();
  };
  renderBoard();
});
