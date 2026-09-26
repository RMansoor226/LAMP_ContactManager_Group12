const CONTACT_FIELDS = [
    ["FirstName", "First name"],
    ["LastName", "Last name"],
    ["PhoneNumber", "Phone"],
    ["Email", "Email"],
];

let contacts = [];
let openId = null;
let editing = null;
let listRequest = 0;
let deleteMode = false;
let deleteSelection = new Set();
let sortMode = "alpha";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("contactList");
    if (list) {
        document.getElementById("contactSearch").addEventListener("input", onSearchInput);
        document.getElementById("contactSort").addEventListener("click", onSortToggle);
        document.getElementById("contactSort").addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSortToggle();
            }
        });
        document.getElementById("deleteButton").addEventListener("click", onDelete);
        document.getElementById("cancelDeleteButton").addEventListener("click", onCancelDelete);
        list.addEventListener("click", onListClick);
        restoreSortMode();
        if (new URLSearchParams(window.location.search).get("created") === "1") {
            showMessage("listMessage", "Contact created.", "success");
        }
        loadContacts("");
    }

    const createForm = document.getElementById("createForm");
    if (createForm) {
        createForm.addEventListener("submit", onCreate);
        bindPhoneInput(createForm.phone);
    }
});

function onSortToggle() {
    sortMode = sortMode === "updated" ? "alpha" : "updated";
    sessionStorage.setItem("contactManagerSort", sortMode);
    contacts = sortContacts(contacts);
    paintSortLabel();
    paintContacts();
}

function restoreSortMode() {
    const saved = sessionStorage.getItem("contactManagerSort");
    sortMode = saved === "updated" ? "updated" : "alpha";
    paintSortLabel();
}

function paintSortLabel() {
    const sort = document.getElementById("contactSort");
    if (!sort) {
        return;
    }
    sort.textContent = `Order: ${sortLabel()}`;
    sort.setAttribute("aria-label", `Order: ${sortLabel()}. Click to toggle.`);
}

function sortLabel() {
    return sortMode === "updated" ? "Recents" : "Alphabetical";
}

function onSearchInput(event) {
    const query = event.currentTarget.value.trim();
    window.clearTimeout(onSearchInput.timer);
    onSearchInput.timer = window.setTimeout(() => {
        loadContacts(query);
    }, 300);
}

async function onCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    clearMessage("formMessage");

    const payload = {
        FirstName: form.firstName.value.trim(),
        LastName: form.lastName.value.trim(),
        PhoneNumber: form.phone.value.trim(),
        Email: form.email.value.trim(),
    };

    if (!payload.FirstName || !payload.LastName || !payload.PhoneNumber || !payload.Email) {
        showMessage("formMessage", "First name, last name, phone, and email are required.", "danger");
        return;
    }

    if (!isEmail(payload.Email)) {
        showMessage("formMessage", "Enter a valid email address.", "danger");
        return;
    }

    if (!isPhone(payload.PhoneNumber)) {
        showMessage("formMessage", "Enter a 10-digit phone number.", "danger");
        return;
    }

    payload.PhoneNumber = formatPhone(payload.PhoneNumber);

    setBusy(submitButton, true);

    try {
        const result = await requestContact("contacts", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("formMessage", result.payload.message || "Could not create the contact.", "danger");
            return;
        }

        window.location.href = "dashboard.html?created=1";
    } catch (error) {
        showMessage("formMessage", "Could not reach the contact service.", "danger");
    } finally {
        setBusy(submitButton, false);
    }
}

async function onDelete() {
    clearMessage("listMessage");

    if (!deleteMode) {
        if (contacts.length === 0) {
            showMessage("listMessage", "No contacts to delete.", "danger");
            return;
        }
        deleteSelection = new Set();
        deleteMode = true;
        setDeleteButtonState();
        paintContacts();
        return;
    }

    if (deleteSelection.size === 0) {
        showMessage("listMessage", "Select one or more contacts, or choose Cancel.", "danger");
        return;
    }

    const ids = [...deleteSelection];
    const button = document.getElementById("deleteButton");
    setBusy(button, true);

    try {
        const failedIds = [];
        let failureMessage = "";
        for (const id of ids) {
            const result = await requestContact(`contacts/${id}`, { method: "DELETE" });
            if (!result.ok || result.payload.status !== "success") {
                failedIds.push(String(id));
                failureMessage = result.payload.message || "Could not delete a contact.";
            }
        }

        if (failedIds.length > 0) {
            showMessage("listMessage", failureMessage, "danger");
            deleteSelection = new Set(failedIds);
            await loadContacts(currentSearch());
            return;
        }

        closeDeletePicker();
        const count = ids.length;
        showMessage("listMessage", count === 1 ? "Contact deleted." : `${count} contacts deleted.`, "success");
        await loadContacts(currentSearch());
    } catch (error) {
        showMessage("listMessage", "Could not reach the contact service.", "danger");
    } finally {
        setBusy(button, false);
    }
}

function onCancelDelete() {
    clearMessage("listMessage");
    closeDeletePicker();
}

function closeDeletePicker() {
    deleteMode = false;
    deleteSelection = new Set();
    setDeleteButtonState();
    paintContacts();
}

function setDeleteButtonState() {
    const button = document.getElementById("deleteButton");
    const cancel = document.getElementById("cancelDeleteButton");
    if (button) {
        button.classList.toggle("is-armed", deleteMode);
        button.setAttribute("aria-expanded", String(deleteMode));
    }
    if (cancel) {
        cancel.classList.toggle("d-none", !deleteMode);
    }
}

function onListClick(event) {
    if (event.target.closest(".contact-check")) {
        return;
    }

    const nameButton = event.target.closest(".contact-name");
    if (nameButton) {
        const id = nameButton.closest(".contact-row").dataset.id;
        openId = String(openId) === id ? null : id;
        editing = null;
        paintContacts();
        return;
    }

    const changeButton = event.target.closest(".field-change");
    if (changeButton) {
        editing = {
            id: changeButton.closest(".contact-row").dataset.id,
            field: changeButton.dataset.field,
        };
        paintContacts();
        const input = document.querySelector(".field-input");
        if (input) {
            input.focus();
        }
        return;
    }

    const saveButton = event.target.closest(".field-save");
    if (saveButton) {
        saveField(saveButton.closest(".contact-field"));
    }
}

async function saveField(fieldRow) {
    const row = fieldRow.closest(".contact-row");
    const contact = contacts.find((item) => String(item.ID) === row.dataset.id);
    if (!contact) {
        return;
    }

    const field = fieldRow.dataset.field;
    const input = fieldRow.querySelector(".field-input");
    const value = input.value.trim();
    clearMessage("listMessage");

    if (!value) {
        showMessage("listMessage", "That field cannot be empty.", "danger");
        return;
    }

    if (field === "Email" && !isEmail(value)) {
        showMessage("listMessage", "Enter a valid email address.", "danger");
        return;
    }

    if (field === "PhoneNumber" && !isPhone(value)) {
        showMessage("listMessage", "Enter a 10-digit phone number.", "danger");
        return;
    }

    const payload = {
        FirstName: contact.FirstName || "",
        LastName: contact.LastName || "",
        PhoneNumber: formatPhone(contact.PhoneNumber || ""),
        Email: contact.Email || "",
    };
    payload[field] = field === "PhoneNumber" ? formatPhone(value) : value;

    const saveButton = fieldRow.querySelector(".field-save");
    setBusy(saveButton, true);

    try {
        const result = await requestContact(`contacts/${contact.ID}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("listMessage", result.payload.message || "Could not update the contact.", "danger");
            return;
        }

        editing = null;
        showMessage("listMessage", "Contact updated.", "success");
        await loadContacts(currentSearch());
    } catch (error) {
        showMessage("listMessage", "Could not reach the contact service.", "danger");
    } finally {
        setBusy(saveButton, false);
    }
}

async function loadContacts(query) {
    const requestId = ++listRequest;
    const path = query ? `contacts?search=${encodeURIComponent(query)}` : "contacts";

    try {
        const result = await requestContact(path);
        if (requestId !== listRequest) {
            return;
        }

        if (!result.ok || result.payload.status !== "success" || !Array.isArray(result.payload.data)) {
            rememberContacts([], result.payload.message || "Could not load contacts.");
            return;
        }

        rememberContacts(result.payload.data);
    } catch (error) {
        if (requestId !== listRequest) {
            return;
        }
        rememberContacts([], "Could not reach the contact service.");
    }
}

function rememberContacts(list, emptyMessage) {
    contacts = Array.isArray(list) ? sortContacts(list) : [];
    if (openId && !contacts.some((item) => String(item.ID) === String(openId))) {
        openId = null;
        editing = null;
    }
    if (deleteMode) {
        const available = new Set(contacts.map((contact) => String(contact.ID)));
        deleteSelection = new Set([...deleteSelection].filter((id) => available.has(id)));
    }
    paintContacts(list && list.length ? undefined : emptyMessage);
}

function paintContacts(emptyMessage) {
    const list = document.getElementById("contactList");
    list.replaceChildren();

    if (contacts.length === 0) {
        const empty = document.createElement("li");
        empty.className = "contact-empty";
        empty.textContent = emptyMessage || "No contacts yet.";
        list.append(empty);
        return;
    }

    contacts.forEach((contact) => {
        list.append(renderContact(contact));
    });
}

function renderContact(contact) {
    const item = document.createElement("li");
    item.className = "contact-row";
    item.dataset.id = contact.ID;
    if (String(contact.ID) === String(openId)) {
        item.classList.add("is-open");
    }

    const summary = document.createElement("div");
    summary.className = "contact-summary";

    if (deleteMode) {
        const box = document.createElement("input");
        box.type = "checkbox";
        box.className = "contact-check";
        box.setAttribute("aria-label", `Select ${contactName(contact)}`);
        box.checked = deleteSelection.has(String(contact.ID));
        box.addEventListener("change", () => {
            const id = String(contact.ID);
            if (box.checked) {
                deleteSelection.add(id);
            } else {
                deleteSelection.delete(id);
            }
        });
        summary.append(box);
    }

    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "contact-name";
    nameButton.textContent = contactName(contact);
    nameButton.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
    summary.append(nameButton);

    if (contact.PhoneNumber) {
        summary.append(metaSpan(formatPhone(contact.PhoneNumber)));
    }
    if (contact.Email) {
        summary.append(metaSpan(contact.Email));
    }

    const detail = document.createElement("div");
    detail.className = "contact-detail";
    CONTACT_FIELDS.forEach(([key, label]) => {
        detail.append(renderField(contact, key, label));
    });

    item.append(summary, detail);
    return item;
}

function renderField(contact, key, label) {
    const row = document.createElement("div");
    row.className = "contact-field";
    row.dataset.field = key;

    const labelEl = document.createElement("span");
    labelEl.className = "field-label";
    labelEl.textContent = label;
    row.append(labelEl);

    const isEditing = editing && String(editing.id) === String(contact.ID) && editing.field === key;
    if (isEditing) {
        const input = document.createElement("input");
        input.className = "field-input";
        if (key === "Email") {
            input.type = "email";
            input.value = contact[key] || "";
            input.maxLength = 50;
        } else if (key === "PhoneNumber") {
            input.type = "tel";
            input.inputMode = "numeric";
            input.maxLength = 14;
            input.placeholder = "(123) 456-7890";
            input.value = formatPhone(contact[key] || "");
            bindPhoneInput(input);
        } else {
            input.type = "text";
            input.value = contact[key] || "";
            input.maxLength = 50;
        }
        row.append(input);

        const save = document.createElement("button");
        save.type = "button";
        save.className = "field-action field-save";
        save.textContent = "Save";
        row.append(save);
        return row;
    }

    const value = document.createElement("span");
    value.className = "field-value";
    value.textContent = key === "PhoneNumber" ? formatPhone(contact[key] || "") || "Not added" : (contact[key] || "Not added");
    row.append(value);

    const change = document.createElement("button");
    change.type = "button";
    change.className = "field-action field-change";
    change.dataset.field = key;
    change.textContent = "Change";
    row.append(change);
    return row;
}

function metaSpan(text) {
    const span = document.createElement("span");
    span.className = "contact-meta";
    span.textContent = text;
    return span;
}

function contactName(contact) {
    const name = [contact.FirstName, contact.LastName].filter(Boolean).join(" ").trim();
    return name || "Unnamed";
}

function sortContacts(list) {
    return [...list].sort((a, b) => {
        if (sortMode === "updated") {
            const updated = contactDate(b).localeCompare(contactDate(a));
            if (updated !== 0) {
                return updated;
            }
            return Number(b.ID) - Number(a.ID);
        }
        return contactName(a).localeCompare(contactName(b), undefined, { sensitivity: "base" });
    });
}

function contactDate(contact) {
    return contact.DateUpdated || contact.DateCreated || "";
}

function bindPhoneInput(input) {
    if (!input) {
        return;
    }

    input.addEventListener("input", () => {
        input.value = formatPhone(input.value);
    });
}

function formatPhone(value) {
    const digits = phoneDigits(value);
    if (digits.length === 0) {
        return "";
    }
    if (digits.length < 4) {
        return `(${digits}`;
    }
    if (digits.length < 7) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function phoneDigits(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function isPhone(value) {
    return phoneDigits(value).length === 10;
}

function currentSearch() {
    const input = document.getElementById("contactSearch");
    return input ? input.value.trim() : "";
}

async function requestContact(path, options = {}) {
    const response = await fetch(`api/${path}`, {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: options.body,
    });

    let payload;
    try {
        payload = await response.json();
    } catch (error) {
        payload = { status: "error", message: "Unexpected server response." };
    }

    return { ok: response.ok, payload };
}
