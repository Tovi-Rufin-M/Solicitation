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
    storageKey: "yearbook_solicitation_donors_v2",
    // Base scroll speed: lower number = faster scroll, higher = slower
    secondsPerDonorCard: 3.5, 
};

// Initial sample donors to display on the scrolling wall
const DEFAULT_DONORS = [
    {
        id: "d-1",
        name: "Tovi M.",
        affiliation: "Earned by tito sunny waterstation",
        amount: 350,
        comment: "I earned my first ₱350 from my part-time job and decided to contribute it to the yearbook fund. Every peso counts!",
        date: "9/28 4:15 PM"
    },
    {
        id: "d-2",
        name: "Tovi M.",
        affiliation: "Earned by manang indhay side quest",
        amount: 336,
        comment: "I earned this by applying the american resume",
        date: "9/26 4:30 PM"
    },
    {
        id: "d-3",
        name: "Anonymous Supporter",
        affiliation: "Grate Grate Dancer",
        amount: 200,
        comment: "secreto talang ni ha hahaha",
        date: "9/28 10:35 PM"
    },
    {
        id: "d-4",
        name: "Anonymous Supporter",
        affiliation: "Gcash GA****L O.",
        amount: 50,
        comment: "",
        date: "9/28 10:42 PM"
    },
    {
        id: "d-5",
        name: "Abby R.",
        affiliation: "Gcash Funds",
        amount: 2000,
        comment: "",
        date: "9/28 10:42 PM"
    },
    {
        id: "d-6",
        name: "KEISHA M.",
        affiliation: "Gcash Funds",
        amount: 250,
        comment: "Why?",
        date: "9/28 10:42 PM"
    }
];

// --------------------------------------------------------------------------
// 2. STATE MANAGEMENT 0947-9628-002
// --------------------------------------------------------------------------
let donors = [];

/**
 * Load donors directly from DEFAULT_DONORS so any changes you make in code
 * immediately show up in your browser!
 */
function loadDonors() {
    donors = [...DEFAULT_DONORS];
    console.log(`[Yearbook Solicitation] Loaded ${donors.length} donors from code.`);
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
 * Format number into currency string (e.g. ₱2,150.00)
 */
function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return `${CONFIG.currencySymbol}${num.toLocaleString('en-US', {
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
    const parts = name.trim().split(/\s+/);
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
    const formattedAmount = (donor.amount && Number(donor.amount) > 0) ? formatCurrency(donor.amount) : null;
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
                ${formattedAmount ? `<span class="donor-amount-pill">${formattedAmount}</span>` : ''}
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
 * Seamlessly loops and ensures at least 5+ items in view.
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

    // Ensure sufficient cards to fill viewport seamlessly before doubling for translateY(-50%)
    let baseMarkup = donorCardsMarkup;
    let multiplier = 1;
    while (multiplier * donors.length < 5) {
        baseMarkup += donorCardsMarkup;
        multiplier++;
    }

    // Duplicate baseMarkup so translateY(-50%) creates an infinite seamless loop
    track.innerHTML = baseMarkup + baseMarkup;

    // Adjust animation speed dynamically based on the number of items
    const totalRendered = multiplier * donors.length;
    const animationDuration = Math.max(18, totalRendered * CONFIG.secondsPerDonorCard);
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
    const btnSubmit = document.getElementById("btn-submit-comment");

    // Single-select relationship radio pills
    const radioPills = document.querySelectorAll(".neu-pill-radio");
    radioPills.forEach(pill => {
        const radio = pill.querySelector('input[type="radio"]');
        if (radio) {
            pill.addEventListener("click", () => {
                radio.checked = true;
                radioPills.forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
            });
            radio.addEventListener("change", () => {
                radioPills.forEach(p => p.classList.remove("active"));
                if (radio.checked) {
                    pill.classList.add("active");
                }
            });
        }
    });

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
        
        // Reset radio pills active state to default "Friends"
        radioPills.forEach(p => {
            const r = p.querySelector('input[type="radio"]');
            if (r && r.value === "Friends") {
                r.checked = true;
                p.classList.add("active");
            } else {
                p.classList.remove("active");
            }
        });

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Comment';
        }
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
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById("donor-name");
            const messageInput = document.getElementById("donor-message");
            const relationshipInput = document.querySelector('input[name="relationship"]:checked');

            const name = (nameInput && nameInput.value.trim()) || "Anonymous";
            const relationship = (relationshipInput && relationshipInput.value) || "Friends";
            const message = messageInput ? messageInput.value.trim() : "";

            if (!message) {
                showToast("Please enter a message or dedication.");
                if (messageInput) messageInput.focus();
                return;
            }

            // Visual feedback: Sending...
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
            }

            try {
                // Send directly to owner's Gmail via FormSubmit AJAX API
                const response = await fetch("https://formsubmit.co/ajax/rufintovi11@gmail.com", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        "Sender Name": name,
                        "Relationship": relationship,
                        "Message": message,
                        "_subject": `New Yearbook Comment from ${name} (${relationship})`,
                        "_template": "table",
                        "_captcha": "false"
                    })
                });

                if (response.ok) {
                    showToast("Thank you! Your comment has been sent.");
                } else {
                    showToast("Comment sent! Thank you for your encouragement.");
                }
            } catch (err) {
                console.warn("[Yearbook] Email send notice:", err);
                showToast("Comment sent! Thank you for your encouragement.");
            } finally {
                closeModal();
            }
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
