
const input = document.getElementById("qr-text");
const sizeSelect = document.getElementById("sizes");
const output = document.getElementById("qr-output");
const placeholder = document.getElementById("qr-placeholder");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const message = document.getElementById("message");
const sizeLabel = document.getElementById("sizeLabel");
const darkColor = document.getElementById("darkColor");
const lightColor = document.getElementById("lightColor");

let selectedType = "url";
let currentContent = "";
let qrInstance = null;

function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("error", isError);
}

function getContent() {
    const value = input.value.trim();

    if (!value) return "";

    switch (selectedType) {
        case "url":
            if (!/^https?:\/\//i.test(value)) {
                return "https://" + value;
            }
            return value;

        case "email":
            return value.startsWith("mailto:")
                ? value
                : "mailto:" + value;

        case "phone":
            return value.startsWith("tel:")
                ? value
                : "tel:" + value;

        default:
            return value;
    }
}

function getHistory() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("qrStudioHistory") || "[]"
        );
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveHistory(content, size) {
    try {
        const history = getHistory();

        history.unshift({
            content,
            size,
            type: selectedType,
            date: new Date().toLocaleString()
        });

        localStorage.setItem(
            "qrStudioHistory",
            JSON.stringify(history.slice(0, 10))
        );
    } catch {
        showMessage(
            "QR generated, but browser storage is unavailable."
        );
    }
}

function generateQR(content = getContent(), save = true) {
    if (!content) {
        showMessage("Please enter some text or a URL first.", true);
        input.focus();
        return;
    }

    if (typeof QRCode === "undefined") {
        showMessage(
            "QR library did not load. Check your internet connection.",
            true
        );
        return;
    }

    const size = Number(sizeSelect.value);

    output.replaceChildren();
    output.style.display = "block";
    placeholder.style.display = "none";

    try {
        qrInstance = new QRCode(output, {
            text: content,
            width: size,
            height: size,
            colorDark: darkColor.value,
            colorLight: lightColor.value,
            correctLevel: QRCode.CorrectLevel.H
        });

        currentContent = content;
        sizeLabel.textContent = `${size} × ${size} px`;
        downloadBtn.disabled = false;

        showMessage("Your QR code was generated successfully!");

        if (save) {
            saveHistory(content, size);
        }
    } catch (error) {
        output.replaceChildren();
        output.style.display = "none";
        placeholder.style.display = "block";
        downloadBtn.disabled = true;
        currentContent = "";
        showMessage("Could not generate QR code. Check your input.", true);
    }
}

function downloadQR() {
    if (!currentContent) {
        showMessage("Generate a QR code before downloading.", true);
        return;
    }

    // QRCode.js creates a canvas or an image.
    const canvas = output.querySelector("canvas");
    const image = output.querySelector("img");

    let downloadURL = "";

    if (canvas) {
        downloadURL = canvas.toDataURL("image/png");
    } else if (image && image.src) {
        downloadURL = image.src;
    }

    if (!downloadURL) {
        showMessage("QR image is not ready yet. Try again.", true);
        return;
    }

    const link = document.createElement("a");
    link.href = downloadURL;
    link.download = "QR_Code.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    showMessage("Your QR code download has started!");
}

function clearQR() {
    input.value = "";
    output.replaceChildren();
    output.style.display = "none";
    placeholder.style.display = "block";

    currentContent = "";
    qrInstance = null;
    downloadBtn.disabled = true;

    showMessage("");
    input.focus();
}

generateBtn.addEventListener("click", () => {
    generateQR();
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        generateQR();
    }
});

downloadBtn.addEventListener("click", downloadQR);
clearBtn.addEventListener("click", clearQR);

sizeSelect.addEventListener("change", () => {
    const size = Number(sizeSelect.value);
    sizeLabel.textContent = `${size} × ${size} px`;

    if (currentContent) {
        generateQR(currentContent, false);
    }
});

darkColor.addEventListener("input", () => {
    if (currentContent) generateQR(currentContent, false);
});

lightColor.addEventListener("input", () => {
    if (currentContent) generateQR(currentContent, false);
});

// Content type selector
const typeConfig = {
    url: {
        placeholder: "https://example.com",
        hint: "Enter a website URL."
    },
    text: {
        placeholder: "Type any text here...",
        hint: "Enter any text or message."
    },
    email: {
        placeholder: "hello@example.com",
        hint: "Enter an email address."
    },
    phone: {
        placeholder: "+91 9876543210",
        hint: "Enter a phone number with country code."
    }
};

document.querySelectorAll(".type-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".type-btn").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");
        selectedType = button.dataset.type;

        input.placeholder = typeConfig[selectedType].placeholder;
        document.querySelector(".hint").textContent =
            typeConfig[selectedType].hint;

        clearQR();
    });
});

// Dark/light theme
const themeBtn = document.getElementById("themeBtn");

try {
    if (localStorage.getItem("qrStudioTheme") === "light") {
        document.body.classList.add("light");
        themeBtn.textContent = "☀";
    }
} catch {}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");

    const light = document.body.classList.contains("light");
    themeBtn.textContent = light ? "☀" : "☾";

    try {
        localStorage.setItem("qrStudioTheme", light ? "light" : "dark");
    } catch {}
});

// Dashboard navigation
const pages = {
    home: document.getElementById("homePage"),
    history: document.getElementById("historyPage"),
    about: document.getElementById("aboutPage")
};

const titles = {
    home: "QR Code Dashboard",
    history: "QR Code History",
    about: "About QR Studio"
};

function navigate(page) {
    if (!pages[page]) return;

    Object.entries(pages).forEach(([name, element]) => {
        element.hidden = name !== page;
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
    });

    document.getElementById("pageTitle").textContent = titles[page];

    if (page === "history") renderHistory();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        navigate(link.dataset.page);
    });
});

// Recent QR code history
function renderHistory() {
    const container = document.getElementById("historyList");
    const history = getHistory();

    container.replaceChildren();

    if (!history.length) {
        const empty = document.createElement("p");
        empty.className = "empty-history";
        empty.textContent = "No history yet. Generate your first QR code!";
        container.appendChild(empty);
        return;
    }

    history.forEach(item => {
        const row = document.createElement("div");
        row.className = "history-item";

        const icon = document.createElement("div");
        icon.className = "history-symbol";
        icon.textContent = "▦";

        const details = document.createElement("div");
        details.className = "history-content";

        const title = document.createElement("strong");
        title.textContent = item.content;

        const date = document.createElement("small");
        date.textContent = `${item.size} × ${item.size} px · ${item.date}`;

        details.append(title, date);

        const load = document.createElement("button");
        load.className = "history-load";
        load.textContent = "Load";
        load.addEventListener("click", () => {
            input.value = item.content;
            sizeSelect.value = String(item.size);
            selectedType = item.type || "text";

            document.querySelectorAll(".type-btn").forEach(button => {
                button.classList.toggle(
                    "selected",
                    button.dataset.type === selectedType
                );
            });

            input.placeholder =
                typeConfig[selectedType]?.placeholder || "Enter content";

            document.querySelector(".hint").textContent =
                typeConfig[selectedType]?.hint || "Enter content.";

            navigate("home");
            generateQR(item.content, false);
        });

        row.append(icon, details, load);
        container.appendChild(row);
    });
}

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    try {
        localStorage.removeItem("qrStudioHistory");
    } catch {}

    renderHistory();
});

document.getElementById("workspace").addEventListener("click", event => {
    if (event.target.closest(".hero-btn")) {
        input.focus();
    }
});
