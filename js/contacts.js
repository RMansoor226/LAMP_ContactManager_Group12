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

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("contactList");
    if (!list) {
        return;
    }

    document.getElementById("contactSearch").addEventListener("input", onSearchInput);
    document.getElementById("createButton").addEventListener("click", toggleCreate);
    document.getElementById("deleteButton").addEventListener("click", onDelete);
    document.getElementById("createForm").addEventListener("submit", onCreate);
    list.addEventListener("click", onListClick);
    loadContacts("");
});

function onSearchInput(event) {
    const query = event.currentTarget.value.trim();
    window.clearTimeout(onSearchInput.timer);
    onSearchInput.timer = window.setTimeout(() => {
        loadContacts(query);
    }, 300);
}

function toggleCreate() {
    const form = document.getElementById("createForm");
    form.classList.toggle("d-none");
    if (!form.classList.contains("d-none")) {
        form.querySelector("input").focus();
    }
}

async function onCreate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    clearMessage("listMessage");

    const payload = {
        FirstName: form.firstName.value.trim(),
        LastName: form.lastName.value.trim(),
        PhoneNumber: form.phone.value.trim(),
        Email: form.email.value.trim(),
    };

    if (!payload.FirstName || !payload.LastName || !payload.PhoneNumber || !payload.Email) {
        showMessage("listMessage", "First name, last name, phone, and email are required.", "danger");
        return;
    }

    if (!isEmail(payload.Email)) {
        showMessage("listMessage", "Enter a valid email address.", "danger");
        return;
    }

    setBusy(submitButton, true);

    try {
        const result = await requestContact("contacts", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("listMessage", result.payload.message || "Could not create the contact.", "danger");
            return;
        }

        form.reset();
        form.classList.add("d-none");
        showMessage("listMessage", "Contact created.", "success");
        await loadContacts(currentSearch());
    } catch (error) {
        showMessage("listMessage", "Could not reach the contact service.", "danger");
    } finally {
        setBusy(submitButton, false);
    }
}

async function onDelete() {
    clearMessage("listMessage");
    const contact = contacts.find((item) => String(item.ID) === String(openId));
    if (!contact) {
        showMessage("listMessage", "Open a contact, then choose Delete.", "danger");
        return;
    }

    const name = contactName(contact);
    if (!window.confirm(`Delete ${name}?`)) {
        return;
    }

    const button = document.getElementById("deleteButton");
    setBusy(button, true);

    try {
        const result = await requestContact(`contacts/${contact.ID}`, { method: "DELETE" });
        if (!result.ok || result.payload.status !== "success") {
            showMessage("listMessage", result.payload.message || "Could not delete the contact.", "danger");
            return;
        }

        openId = null;
        editing = null;
        showMessage("listMessage", "Contact deleted.", "success");
        await loadContacts(currentSearch());
    } catch (error) {
        showMessage("listMessage", "Could not reach the contact service.", "danger");
    } finally {
        setBusy(button, false);
    }
}

function onListClick(event) {
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

    const payload = {
        FirstName: contact.FirstName || "",
        LastName: contact.LastName || "",
        PhoneNumber: contact.PhoneNumber || "",
        Email: contact.Email || "",
    };
    payload[field] = value;

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

    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "contact-name";
    nameButton.textContent = contactName(contact);
    nameButton.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
    summary.append(nameButton);

    if (contact.PhoneNumber) {
        summary.append(metaSpan(contact.PhoneNumber));
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
        input.value = contact[key] || "";
        input.maxLength = 50;
        if (key === "Email") {
            input.type = "email";
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
    value.textContent = contact[key] || "Not added";
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
        return contactName(a).localeCompare(contactName(b), undefined, { sensitivity: "base" });
    });
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
