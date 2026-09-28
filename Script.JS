/**
 * ==========================================================================
 * YEARBOOK PAYMENT SOLICITATION & DONOR WALL
 * Script.JS
 * 
 * Includes:
 * 1. Configuration & Initial Seed Data
 * 2. Infinite Vertical Scrolling Marquee Engine
 * 3. Goal & Progress Bar Calculator
 * 4. Clipboard Copy Utilities
 * 5. Interactive Modal & Dynamic Donor Addition (with LocalStorage)
 * 6. Console Debug Helpers (accessible via window.YearbookDebug)
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. CONFIGURATION & SEED DATA (Customize these for your campaign!)
// --------------------------------------------------------------------------
const CONFIG = {
    campaignGoal: 2150, // Target goal amount in Pesos (₱)
    currencySymbol: "₱",
    storageKey: "yearbook_solicitation_donors_v1",
    // Base scroll speed: lower number = faster scroll, higher = slower
    secondsPerDonorCard: 3.5, 
};

// Initial sample donors to display on the scrolling wall
const DEFAULT_DONORS = [
    {
        id: "d-1",
        name: "Atty. Carlos Mendoza",
        affiliation: "Batch 2004 Alumni",
        amount: 500,
        comment: "Wishing the Class of 2026 the best of luck. Never stop learning and serving!",
        date: "2 hours ago"
    },
    {
        id: "d-2",
        name: "Engr. & Mrs. Dela Rosa",
        affiliation: "Proud Parents",
        amount: 300,
        comment: "So proud of our daughter Sophia and the entire graduating batch. Congratulations!",
        date: "5 hours ago"
    },
    {
        id: "d-3",
        name: "Dr. Elena Ramos",
        affiliation: "Faculty & Mentor",
        amount: 250,
        comment: "Every picture in this book holds a piece of your resilience. Proud teacher here!",
        date: "Yesterday"
    },
    {
        id: "d-4",
        name: "Marcus Aurelius T.",
        affiliation: "Batch 2026 Graduate",
        amount: 50,
        comment: "Pledged my savings to help out our batchmates. Let's make this yearbook historic!",
        date: "1 day ago"
    },
    {
        id: "d-5",
        name: "Anonymous Benefactor",
        affiliation: "Friend of the School",
        amount: 40,
        comment: "For the dreamers and the achievers. May your bright futures shine through these pages.",
        date: "2 days ago"
    },
    {
        id: "d-6",
        name: "Kirsten & Friends",
        affiliation: "Senior High Alumni",
        amount: 10,
        comment: "Cherish every page! High school memories will be your anchor in college.",
        date: "3 days ago"
    }
];

// --------------------------------------------------------------------------
// 2. STATE MANAGEMENT
// --------------------------------------------------------------------------
let donors = [];

/**
 * Load donors from LocalStorage or initialize with defaults
 */
function loadDonors() {
    try {
        const stored = localStorage.getItem(CONFIG.storageKey);
        if (stored) {
            donors = JSON.parse(stored);
            console.log(`[Yearbook Solicitation] Loaded ${donors.length} donors from LocalStorage.`);
        } else {
            donors = [...DEFAULT_DONORS];
            saveDonors();
            console.log("[Yearbook Solicitation] Initialized default seed donors.");
        }
    } catch (err) {
        console.warn("[Yearbook Solicitation] Error reading LocalStorage, falling back to seed data:", err);
        donors = [...DEFAULT_DONORS];
    }
}

/**
 * Save current donor array to LocalStorage
 */
function saveDonors() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(donors));
    } catch (err) {
        console.error("[Yearbook Solicitation] Could not save to LocalStorage:", err);
    }
}

// --------------------------------------------------------------------------
// 3. UI RENDERING & TICKER ANIMATION
// --------------------------------------------------------------------------

/**
 * Format number into currency string (e.g. ₱50,000.00)
 */
function formatCurrency(amount) {
    return `${CONFIG.currencySymbol}${Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * Calculate total funds raised and update the progress bar & labels
 */
function updateCampaignStats() {
    const totalRaised = donors.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const percentage = Math.min(100, Math.round((totalRaised / CONFIG.campaignGoal) * 100));

    const statRaisedEl = document.getElementById("stat-raised");
    const statGoalEl = document.getElementById("stat-goal");
    const statsPercentageEl = document.getElementById("stats-percentage");
    const progressBarEl = document.getElementById("progress-bar");
    const badgeEl = document.getElementById("donor-count-badge");

    if (statRaisedEl) statRaisedEl.textContent = formatCurrency(totalRaised);
    if (statGoalEl) statGoalEl.textContent = formatCurrency(CONFIG.campaignGoal);
    if (statsPercentageEl) statsPercentageEl.textContent = `${percentage}%`;
    if (progressBarEl) progressBarEl.style.width = `${percentage}%`;
    if (badgeEl) badgeEl.textContent = `${donors.length} ${donors.length === 1 ? 'Supporter' : 'Supporters'}`;

    return { totalRaised, percentage, goal: CONFIG.campaignGoal };
}

/**
 * Get initials for avatar display
 */
function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

/**
 * Create a single donor card HTML element
 */
function createDonorCardHTML(donor) {
    const initials = getInitials(donor.name);
    const safeName = escapeHTML(donor.name);
    const safeAffiliation = escapeHTML(donor.affiliation || "Generous Supporter");
    const safeComment = escapeHTML(donor.comment || "Thank you for supporting our yearbook!");
    const formattedAmount = formatCurrency(donor.amount);
    const dateStr = donor.date || "Just now";

    return `
        <article class="donor-card" data-id="${donor.id || ''}">
            <div class="donor-card-header">
                <div class="donor-profile">
                    <div class="donor-avatar" aria-hidden="true">${initials}</div>
                    <div class="donor-name-wrap">
                        <span class="donor-name">${safeName}</span>
                        <span class="donor-meta">${safeAffiliation} • ${dateStr}</span>
                    </div>
                </div>
                <span class="donor-amount-pill">${formattedAmount}</span>
            </div>
            <p class="donor-comment">“${safeComment}”</p>
        </article>
    `;
}

/**
 * Basic HTML escaping to prevent XSS in user submissions
 */
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Render the scrolling donor ticker.
 * Clones the donor cards to achieve a seamless, continuous vertical loop!
 */
function renderDonorTicker() {
    const track = document.getElementById("ticker-track");
    if (!track) return;

    if (donors.length === 0) {
        track.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                Be the first to donate and leave a message on the wall!
            </div>
        `;
        track.style.animation = "none";
        return;
    }

    // Generate HTML for all donors
    const donorCardsMarkup = donors.map(createDonorCardHTML).join("");

    // To create an infinite loop without jitter, we duplicate the list
    // so translateY(-50%) loops smoothly back to translateY(0)
    track.innerHTML = donorCardsMarkup + donorCardsMarkup;

    // Adjust animation speed dynamically based on the number of items
    const totalCount = donors.length;
    const animationDuration = Math.max(16, totalCount * CONFIG.secondsPerDonorCard);
    track.style.animation = `smoothVerticalScroll ${animationDuration}s linear infinite`;
}

// --------------------------------------------------------------------------
// 4. INTERACTION: CLIPBOARD COPY & TOAST NOTIFICATIONS
// --------------------------------------------------------------------------
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll(".btn-copy");
    copyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const textToCopy = btn.getAttribute("data-copy");
            if (!textToCopy) return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`Copied "${textToCopy}" to clipboard!`);
                
                // Visual feedback on the button itself
                const originalIcon = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check" style="color: var(--accent-emerald);"></i>`;
                setTimeout(() => {
                    btn.innerHTML = originalIcon;
                }, 1800);
            }).catch(err => {
                console.error("Clipboard copy failed:", err);
                showToast(`Account: ${textToCopy}`);
            });
        });
    });
}

let toastTimer = null;
function showToast(message) {
    const toast = document.getElementById("neu-toast");
    const toastText = document.getElementById("toast-text");
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// --------------------------------------------------------------------------
// 5. MODAL & FORM HANDLERS
// --------------------------------------------------------------------------
function setupModal() {
    const modal = document.getElementById("pledge-modal");
    const btnOpenSide = document.getElementById("btn-open-form-side");
    const btnClose = document.getElementById("btn-close-modal");
    const btnCancel = document.getElementById("btn-cancel-modal");
    const form = document.getElementById("donation-form");

    function openModal() {
        if (!modal) return;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        const firstInput = document.getElementById("donor-name");
        if (firstInput) setTimeout(() => firstInput.focus(), 150);
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        if (form) form.reset();
    }

    if (btnOpenSide) btnOpenSide.addEventListener("click", openModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    // Close when clicking outside modal box
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Escape key closes modal
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.classList.contains("active")) {
            closeModal();
        }
    });

    // Handle Form Submit
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("donor-name");
            const amountInput = document.getElementById("donor-amount");
            const affiliationInput = document.getElementById("donor-affiliation");
            const messageInput = document.getElementById("donor-message");

            const newDonor = {
                id: `d-${Date.now()}`,
                name: nameInput.value.trim() || "Anonymous",
                amount: parseFloat(amountInput.value) || 0,
                affiliation: affiliationInput.value.trim() || "Supporter",
                comment: messageInput.value.trim() || "Best wishes to the graduating class!",
                date: "Just now"
            };

            // Prepend new donor to top of array
            donors.unshift(newDonor);
            saveDonors();

            // Refresh UI
            updateCampaignStats();
            renderDonorTicker();

            closeModal();
            showToast("Thank you! Your dedication was posted to the wall.");
            console.log("[Yearbook Solicitation] New donor recorded:", newDonor);
        });
    }
}

// --------------------------------------------------------------------------
// 6. DEBUG & RESET CONTROLS
// --------------------------------------------------------------------------
function setupDebugTools() {
    const btnReset = document.getElementById("btn-debug-reset");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            if (confirm("Reset demo donors back to original seed data?")) {
                localStorage.removeItem(CONFIG.storageKey);
                donors = [...DEFAULT_DONORS];
                saveDonors();
                updateCampaignStats();
                renderDonorTicker();
                showToast("Demo data reset successfully!");
            }
        });
    }

    // Expose debug utilities in browser console for testing
    window.YearbookDebug = {
        getDonors: () => donors,
        setGoal: (newGoal) => {
            CONFIG.campaignGoal = Number(newGoal);
            updateCampaignStats();
            console.log(`[Debug] Goal updated to ₱${newGoal}`);
        },
        addMockDonor: (name = "Debug Donor", amount = 1000, comment = "Test comment from console") => {
            const mock = {
                id: `d-${Date.now()}`,
                name,
                amount: Number(amount),
                affiliation: "Console Tester",
                comment,
                date: "Just now"
            };
            donors.unshift(mock);
            saveDonors();
            updateCampaignStats();
            renderDonorTicker();
            console.log("[Debug] Added mock donor:", mock);
        },
        resetData: () => {
            localStorage.removeItem(CONFIG.storageKey);
            donors = [...DEFAULT_DONORS];
            saveDonors();
            updateCampaignStats();
            renderDonorTicker();
            console.log("[Debug] Donor data reset to defaults.");
        },
        getStats: () => updateCampaignStats()
    };

    console.info(
        "%c Yearbook Solicitation Ready! %c\n- Use %cYearbookDebug.addMockDonor('Name', 500, 'Message')%c to simulate donors.\n- Use %cYearbookDebug.setGoal(75000)%c to change the target.\n- Use %cYearbookDebug.resetData()%c to restore defaults.",
        "background: #3b66f5; color: #fff; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
        "color: #555;",
        "font-weight: bold; color: #0ea573;",
        "color: #555;",
        "font-weight: bold; color: #0ea573;",
        "color: #555;",
        "font-weight: bold; color: #0ea573;",
        "color: #555;"
    );
}

// --------------------------------------------------------------------------
// 7. INITIALIZATION ON DOM READY
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadDonors();
    updateCampaignStats();
    renderDonorTicker();
    setupCopyButtons();
    setupModal();
    setupDebugTools();
});
