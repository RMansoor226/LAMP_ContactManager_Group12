let users = [];
let openId = null;
let contactsCache = {};
let contactsOpenId = null;
let listRequest = 0;
let passwordEditId = null;

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("userList");
    if (!list) {
        return;
    }

    if (!requireAdminPage()) {
        return;
    }

    document.getElementById("userSearch").addEventListener("input", onSearchInput);
    list.addEventListener("click", onListClick);
    loadUsers("");
});

function requireAdminPage() {
    const raw = sessionStorage.getItem("contactManagerUser");
    if (!raw) {
        window.location.href = "index.html";
        return false;
    }

    try {
        const user = JSON.parse(raw);
        if (!Number(user.IsAdmin)) {
            showMessage("listMessage", "Admin privileges required.", "danger");
            window.setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
            return false;
        }
    } catch (error) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}

function onSearchInput(event) {
    const query = event.currentTarget.value.trim();
    window.clearTimeout(onSearchInput.timer);
    onSearchInput.timer = window.setTimeout(() => {
        loadUsers(query);
    }, 300);
}

function onListClick(event) {
    const nameButton = event.target.closest(".contact-name");
    if (nameButton) {
        const id = nameButton.closest(".contact-row").dataset.id;
        openId = String(openId) === id ? null : id;
        passwordEditId = null;
        if (String(contactsOpenId) !== String(openId)) {
            contactsOpenId = null;
        }
        paintUsers();
        return;
    }

    const promoteButton = event.target.closest("[data-action='promote']");
    if (promoteButton) {
        const user = findUser(promoteButton.closest(".contact-row").dataset.id);
        if (user) {
            updateUserProfile(user, { IsAdmin: 1 });
        }
        return;
    }

    const demoteButton = event.target.closest("[data-action='demote']");
    if (demoteButton) {
        const user = findUser(demoteButton.closest(".contact-row").dataset.id);
        if (user) {
            updateUserProfile(user, { IsAdmin: 0 });
        }
        return;
    }

    const disableButton = event.target.closest("[data-action='disable']");
    if (disableButton) {
        setUserStatus(disableButton.closest(".contact-row").dataset.id, 1);
        return;
    }

    const enableButton = event.target.closest("[data-action='enable']");
    if (enableButton) {
        setUserStatus(enableButton.closest(".contact-row").dataset.id, 0);
        return;
    }

    const passwordToggle = event.target.closest("[data-action='password-toggle']");
    if (passwordToggle) {
        const id = passwordToggle.closest(".contact-row").dataset.id;
        passwordEditId = String(passwordEditId) === id ? null : id;
        paintUsers();
        const input = document.querySelector(`#password-form-${id} input`);
        if (input) {
            input.focus();
        }
        return;
    }

    const passwordSave = event.target.closest("[data-action='password-save']");
    if (passwordSave) {
        const id = passwordSave.closest(".contact-row").dataset.id;
        const form = document.getElementById(`password-form-${id}`);
        const password = form.querySelector("input[name='password']").value;
        const confirm = form.querySelector("input[name='confirm']").value;
        clearMessage("listMessage");

        if (!password) {
            showMessage("listMessage", "Enter a new password.", "danger");
            return;
        }
        if (password !== confirm) {
            showMessage("listMessage", "Passwords do not match.", "danger");
            return;
        }
        if (password.length > 72) {
            showMessage("listMessage", "Password cannot exceed 72 characters.", "danger");
            return;
        }

        setUserPassword(id, password).then((ok) => {
            if (ok) {
                passwordEditId = null;
                paintUsers();
            }
        });
        return;
    }

    const contactsToggle = event.target.closest("[data-action='contacts-toggle']");
    if (contactsToggle) {
        const id = contactsToggle.closest(".contact-row").dataset.id;
        if (String(contactsOpenId) === id) {
            contactsOpenId = null;
            paintUsers();
            return;
        }
        contactsOpenId = id;
        loadUserContacts(id);
    }
}

function findUser(id) {
    return users.find((user) => String(user.ID) === String(id));
}

async function updateUserProfile(user, overrides) {
    clearMessage("listMessage");
    const id = user.ID;
    setRowBusy(id, true);

    const payload = {
        FirstName: user.FirstName,
        LastName: user.LastName,
        Username: user.Username,
        IsAdmin: Number(user.IsAdmin) ? 1 : 0,
        ...overrides,
    };

    try {
        const result = await requestAdmin(`admin/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("listMessage", result.payload.message || "Could not update the user.", "danger");
            return false;
        }

        replaceUser(result.payload.data);
        clearMessage("listMessage");
        paintUsers();
        return true;
    } catch (error) {
        showMessage("listMessage", "Could not reach the admin service.", "danger");
        return false;
    } finally {
        setRowBusy(id, false);
    }
}

async function setUserStatus(id, disabled) {
    clearMessage("listMessage");
    setRowBusy(id, true);

    try {
        const result = await requestAdmin(`admin/users/${id}/status`, {
            method: "PUT",
            body: JSON.stringify({ Disabled: disabled }),
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("listMessage", result.payload.message || "Could not update account status.", "danger");
            return false;
        }

        replaceUser(result.payload.data);
        clearMessage("listMessage");
        paintUsers();
        return true;
    } catch (error) {
        showMessage("listMessage", "Could not reach the admin service.", "danger");
        return false;
    } finally {
        setRowBusy(id, false);
    }
}

async function setUserPassword(id, password) {
    clearMessage("listMessage");
    setRowBusy(id, true);

    try {
        const result = await requestAdmin(`admin/users/${id}/password`, {
            method: "PUT",
            body: JSON.stringify({ Password: password }),
        });

        if (!result.ok || result.payload.status !== "success") {
            showMessage("listMessage", result.payload.message || "Could not update the password.", "danger");
            return false;
        }

        clearMessage("listMessage");
        return true;
    } catch (error) {
        showMessage("listMessage", "Could not reach the admin service.", "danger");
        return false;
    } finally {
        setRowBusy(id, false);
    }
}

function replaceUser(updated) {
    if (!updated || updated.ID == null) {
        return;
    }
    users = users.map((user) => (String(user.ID) === String(updated.ID) ? updated : user));
}

function setRowBusy(id, busy) {
    const row = document.querySelector(`.contact-row[data-id="${id}"]`);
    if (!row) {
        return;
    }
    row.querySelectorAll("button").forEach((button) => setBusy(button, busy));
}

async function loadUsers(query) {
    const requestId = ++listRequest;
    const path = query ? `admin/users?search=${encodeURIComponent(query)}` : "admin/users";

    try {
        const result = await requestAdmin(path);
        if (requestId !== listRequest) {
            return;
        }

        if (!result.ok || result.payload.status !== "success" || !Array.isArray(result.payload.data)) {
            if (result.payload && /admin/i.test(result.payload.message || "")) {
                showMessage("listMessage", result.payload.message, "danger");
                window.setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1200);
                return;
            }
            rememberUsers([], result.payload.message || "Could not load users.");
            return;
        }

        rememberUsers(result.payload.data);
    } catch (error) {
        if (requestId !== listRequest) {
            return;
        }
        rememberUsers([], "Could not reach the admin service.");
    }
}

async function loadUserContacts(userId) {
    clearMessage("listMessage");
    paintUsers();

    try {
        const result = await requestAdmin(`admin/contacts?userId=${encodeURIComponent(userId)}`);
        if (!result.ok || result.payload.status !== "success" || !Array.isArray(result.payload.data)) {
            showMessage("listMessage", result.payload.message || "Could not load contacts.", "danger");
            contactsCache[userId] = [];
            paintUsers();
            return;
        }

        contactsCache[userId] = result.payload.data;
        paintUsers();
    } catch (error) {
        showMessage("listMessage", "Could not reach the admin service.", "danger");
        contactsCache[userId] = [];
        paintUsers();
    }
}

function rememberUsers(list, emptyMessage) {
    users = Array.isArray(list) ? list : [];
    if (openId && !users.some((user) => String(user.ID) === String(openId))) {
        openId = null;
        passwordEditId = null;
        contactsOpenId = null;
    }
    paintUsers(list && list.length ? undefined : emptyMessage);
}

function paintUsers(emptyMessage) {
    const list = document.getElementById("userList");
    list.replaceChildren();

    if (users.length === 0) {
        const empty = document.createElement("li");
        empty.className = "contact-empty";
        empty.textContent = emptyMessage || "No users found.";
        list.append(empty);
        return;
    }

    users.forEach((user) => {
        list.append(renderUser(user));
    });
}

function renderUser(user) {
    const item = document.createElement("li");
    item.className = "contact-row";
    item.dataset.id = user.ID;
    if (String(user.ID) === String(openId)) {
        item.classList.add("is-open");
    }

    const summary = document.createElement("div");
    summary.className = "contact-summary admin-summary";

    const identity = document.createElement("div");
    identity.className = "admin-identity";

    const nameButton = document.createElement("button");
    nameButton.type = "button";
    nameButton.className = "contact-name";
    nameButton.textContent = userName(user);
    nameButton.setAttribute("aria-expanded", String(item.classList.contains("is-open")));
    identity.append(nameButton);

    identity.append(metaSpan(user.Username || ""));

    if (Number(user.IsAdmin)) {
        identity.append(badge("Admin", "admin"));
    }
    if (Number(user.Disabled)) {
        identity.append(badge("Disabled", "disabled"));
    }

    summary.append(identity);

    const rowActions = document.createElement("div");
    rowActions.className = "admin-row-actions";

    const isSelf = isCurrentUser(user.ID);

    if (Number(user.IsAdmin)) {
        const demote = actionButton("Remove admin", "demote");
        if (isSelf) {
            demote.disabled = true;
            demote.title = "Demoting yourself is blocked if you are the last active admin.";
        }
        rowActions.append(demote);
    } else {
        rowActions.append(actionButton("Make admin", "promote"));
    }

    if (Number(user.Disabled)) {
        rowActions.append(actionButton("Enable account", "enable"));
    } else {
        const disable = actionButton("Disable account", "disable");
        if (isSelf) {
            disable.disabled = true;
            disable.title = "You cannot disable your own account.";
        }
        rowActions.append(disable);
    }

    summary.append(rowActions);

    const detail = document.createElement("div");
    detail.className = "contact-detail";

    detail.append(infoRow("Username", user.Username || "—"));

    const actions = document.createElement("div");
    actions.className = "admin-actions";
    actions.append(actionButton(
        String(passwordEditId) === String(user.ID) ? "Cancel password" : "Change password",
        "password-toggle"
    ));
    actions.append(actionButton(
        String(contactsOpenId) === String(user.ID) ? "Hide contacts" : "View contacts",
        "contacts-toggle"
    ));
    detail.append(actions);

    if (String(passwordEditId) === String(user.ID)) {
        detail.append(renderPasswordForm(user.ID));
    }

    if (String(contactsOpenId) === String(user.ID)) {
        detail.append(renderContactsPanel(user.ID));
    }

    item.append(summary, detail);
    return item;
}

function renderPasswordForm(userId) {
    const form = document.createElement("div");
    form.className = "admin-password-form";
    form.id = `password-form-${userId}`;

    const password = document.createElement("input");
    password.className = "form-control mb-2";
    password.type = "password";
    password.name = "password";
    password.placeholder = "New password";
    password.maxLength = 72;
    password.autocomplete = "new-password";

    const confirm = document.createElement("input");
    confirm.className = "form-control mb-2";
    confirm.type = "password";
    confirm.name = "confirm";
    confirm.placeholder = "Confirm password";
    confirm.maxLength = 72;
    confirm.autocomplete = "new-password";

    const save = actionButton("Save password", "password-save");
    save.classList.add("field-action");

    form.append(password, confirm, save);
    return form;
}

function renderContactsPanel(userId) {
    const panel = document.createElement("div");
    panel.className = "admin-contacts";

    const heading = document.createElement("div");
    heading.className = "admin-contacts-heading";
    heading.textContent = "Contacts";
    panel.append(heading);

    if (!(userId in contactsCache)) {
        const loading = document.createElement("p");
        loading.className = "mb-0";
        loading.textContent = "Loading contacts…";
        panel.append(loading);
        return panel;
    }

    const contacts = contactsCache[userId];
    if (!contacts.length) {
        const empty = document.createElement("p");
        empty.className = "mb-0";
        empty.textContent = "This user has no contacts.";
        panel.append(empty);
        return panel;
    }

    const list = document.createElement("ul");
    list.className = "admin-contact-list";

    contacts.forEach((contact) => {
        const item = document.createElement("li");
        const name = [contact.FirstName, contact.LastName].filter(Boolean).join(" ").trim() || "Unnamed";
        const bits = [name];
        if (contact.PhoneNumber) {
            bits.push(contact.PhoneNumber);
        }
        if (contact.Email) {
            bits.push(contact.Email);
        }
        item.textContent = bits.join(" · ");
        list.append(item);
    });

    panel.append(list);
    return panel;
}

function infoRow(label, value) {
    const row = document.createElement("div");
    row.className = "contact-field";

    const labelEl = document.createElement("span");
    labelEl.className = "field-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "field-value";
    valueEl.textContent = value;

    row.append(labelEl, valueEl);
    return row;
}

function actionButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm btn-login";
    button.dataset.action = action;
    button.textContent = label;
    return button;
}

function badge(text, kind) {
    const span = document.createElement("span");
    span.className = `admin-badge admin-badge-${kind}`;
    span.textContent = text;
    return span;
}

function metaSpan(text) {
    const span = document.createElement("span");
    span.className = "contact-meta";
    span.textContent = text;
    return span;
}

function userName(user) {
    const name = [user.FirstName, user.LastName].filter(Boolean).join(" ").trim();
    return name || user.Username || "Unnamed";
}

function isCurrentUser(id) {
    try {
        const user = JSON.parse(sessionStorage.getItem("contactManagerUser") || "{}");
        return String(user.ID) === String(id);
    } catch (error) {
        return false;
    }
}

async function requestAdmin(path, options = {}) {
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
